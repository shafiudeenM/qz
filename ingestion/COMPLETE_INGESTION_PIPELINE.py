# ============================================================================
# COMPLETE END-TO-END INGESTION PIPELINE
# FOR TNPSC CONTENT (EXAMS & TEXTBOOKS)
# ============================================================================

import json, logging, time, os, sys, argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

# Import your modules
from PRODUCTION_PDF_PARSER import PDFExtractor
from PRODUCTION_GROQ_STRUCTURER import GroqStructurer
from PRODUCTION_TEXTBOOK_STRUCTURER import TextbookStructurer
from supabase_config import get_supabase_settings as get_settings
from SUPABASE_DATABASE import supabase_db
from logger_config import setup_logging, get_logger

logger = get_logger(__name__)

class IngestionPipeline:
    """UNIVERSAL INGESTION PIPELINE"""
    
    def __init__(self, mode: str = "exam"):
        setup_logging()
        self.settings = get_settings()
        self.mode = mode
        self.pdf_extractor = PDFExtractor(enable_ocr=True, max_workers=4)
        
        # Initialize appropriate "Brain"
        if self.mode == "textbook":
            self.structurer = TextbookStructurer(groq_api_key=self.settings.groq_api_key)
            logger.info("🧠 Initialized TEXTBOOK Brain")
        else:
            self.structurer = GroqStructurer(groq_api_key=self.settings.groq_api_key)
            logger.info("🧠 Initialized EXAM Brain")
            
        self.start_time = None
        self.results = {
            "total_files": 0,
            "success": 0,
            "failed": 0,
            "total_items": 0, # questions or concepts
            "failed_files": [],
            "details": []
        }
    
    def run_complete_pipeline(self, source_directory: str):
        """RUN COMPLETE PIPELINE"""
        
        logger.info("=" * 80)
        logger.info(f"🚀 STARTING {self.mode.upper()} INGESTION PIPELINE")
        logger.info("=" * 80)
        
        self.start_time = time.time()
        
        # STEP 1: Collect all files
        files = sorted(Path(source_directory).glob("*.pdf"))
        self.results["total_files"] = len(files)
        
        logger.info(f"📂 Found {len(files)} files to ingest")
        
        if not files:
            logger.error("❌ No files found!")
            return
        
        # STEP 2: Process each file
        for idx, file_path in enumerate(files, 1):
            logger.info(f"\n{'='*80}")
            logger.info(f"[{idx}/{len(files)}] 📄 PROCESSING: {file_path.name}")
            logger.info(f"{'='*80}")
            
            try:
                result = self._process_single_file(str(file_path), idx)
                if result["success"]:
                    self.results["success"] += 1
                else:
                    self.results["failed"] += 1
                    self.results["failed_files"].append(file_path.name)
                
                self.results["details"].append(result)
            
            except Exception as e:
                logger.error(f"❌ CRITICAL ERROR: {str(e)}")
                self.results["failed"] += 1
                self.results["failed_files"].append(file_path.name)
        
        # STEP 3: Generate summary report
        self._generate_report()
    
    def _process_single_file(self, file_path: str, index: int) -> Dict[str, Any]:
        """PROCESS SINGLE FILE"""
        
        result = {
            "file": Path(file_path).name,
            "index": index,
            "success": False,
            "items": 0,
            "errors": []
        }
        
        try:
            # PHASE 1: EXTRACT
            logger.info(f"📖 PHASE 1: Extracting text...")
            extraction_result = self.pdf_extractor.extract_pdf(file_path)
            
            if not extraction_result["success"]:
                raise Exception(f"Extraction failed: {extraction_result.get('error')}")
            
            pages_data = extraction_result["pages"]
            logger.info(f"✅ Extracted {len(pages_data)} pages")
            
            # PHASE 2: STRUCTURE & STORE (Incremental)
            logger.info(f"🧠 PHASE 2: Structuring & Storing as {self.mode}...")
            all_items = []     # For tracking total count
            batch_items = []   # For incremental storage
            
            for page_data in pages_data:
                if len(page_data["text"].strip()) < 100: continue
                
                try:
                    items = self.structurer.structure_text(
                        text=page_data["text"],
                        source_file=Path(file_path).name,
                        source_page=page_data["page_number"]
                    )
                    
                    if items:
                        all_items.extend(items)
                        batch_items.extend(items)
                        logger.info(f"  ✅ Extracted {len(items)} items from page {page_data['page_number']}")
                
                except Exception as e:
                    logger.warning(f"  ⚠️ Page {page_data['page_number']} failed: {str(e)}")
                
                # INCREMENTAL STORAGE: Every 5 pages or if batch gets large
                if len(batch_items) >= 5: # Store small batches frequently
                    logger.info(f"  💾 Storing batch of {len(batch_items)} items...")
                    if self.mode == "textbook":
                        self._store_concepts(batch_items)
                    else:
                        self._store_questions(batch_items, Path(file_path).name)
                    batch_items = [] # Clear batch
                
                # Polite delay to avoid hitting Groq rate limits
                time.sleep(2)
            
            # STORE REMAINING ITEMS
            if batch_items:
                logger.info(f"  💾 Storing final batch of {len(batch_items)} items...")
                if self.mode == "textbook":
                    self._store_concepts(batch_items)
                else:
                    self._store_questions(batch_items, Path(file_path).name)
            
            result["items"] = len(all_items)
            self.results["total_items"] += len(all_items)
            
            result["success"] = True
            return result
        
        except Exception as e:
            logger.error(f"❌ PHASE ERROR: {str(e)}")
            result["errors"].append(str(e))
            return result
    
    def _store_questions(self, questions: List[Dict], source_file: str):
        """STORE QUESTIONS TO SUPABASE"""
        
        logger.info(f"📊 Storing {len(questions)} questions...")
        
        formatted_questions = []
        for q in questions:
            # Map structurer output to Supabase DB schema
            question_data = {
                "exam_year": self._extract_year(source_file),
                "exam_type": self._extract_exam_type(source_file),
                "question_text": q.get("question_text", ""),
                "options": q.get("options", []),
                "correct_answer": q.get("correct_answer", ""),
                "explanation": q.get("explanation", ""),
                "difficulty_level": q.get("difficulty", 2),
                "source_file": source_file,
                "source_page": q.get("source_page", 0),
                "is_validated": True,
                "confidence_score": 0.9,
                "ingested_at": datetime.utcnow().isoformat()
            }
            formatted_questions.append(question_data)
        
        try:
            supabase_db.insert_questions_batch(formatted_questions)
        except Exception as e:
            logger.error(f"❌ Database storage failed: {str(e)}")
            raise

    def _store_concepts(self, concepts: List[Dict]):
        """Store Concepts to Supabase"""
        supabase_db.insert_concepts_batch(concepts)
    
    def _extract_year(self, filename: str) -> int:
        import re
        match = re.search(r'(20\d{2})', filename)
        return int(match.group(1)) if match else 2024
    
    def _extract_exam_type(self, filename: str) -> str:
        if "Prelims" in filename.lower(): return "Prelims"
        if "Mains" in filename.lower(): return "Mains"
        return "Unknown"
    
    def _generate_report(self):
        logger.info("\n" + "=" * 80)
        logger.info(f"📊 FINAL {self.mode.upper()} INGESTION REPORT")
        logger.info("=" * 80)
        logger.info(f"Total Files: {self.results['total_files']}")
        logger.info(f"Successful: {self.results['success']}")
        logger.info(f"Total Items: {self.results['total_items']}")
        logger.info("=" * 80)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TNPSC Ingestion Pipeline")
    parser.add_argument("--mode", choices=["exam", "textbook"], default="exam", help="Type of content to ingest")
    parser.add_argument("--dir", help="Directory containing PDFs (defaults to data/raw/papers or data/raw/textbooks)")
    
    args = parser.parse_args()
    
    # Environment Setup
    os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY", "")
    
    # Determine directory
    target_dir = args.dir
    if not target_dir:
        if args.mode == "textbook":
            target_dir = "data/raw/textbooks"
        else:
            target_dir = "data/raw/papers"
    
    # Create directory if it doesn't exist (helpful for first run)
    if not os.path.exists(target_dir):
        print(f"⚠️ Directory not found: {target_dir}")
        print(f"Creating it now...")
        os.makedirs(target_dir, exist_ok=True)
        print(f"❌ Directory was empty. Please add PDF files to: {target_dir}")
        sys.exit(1)
        
    pipeline = IngestionPipeline(mode=args.mode)
    pipeline.run_complete_pipeline(target_dir)

