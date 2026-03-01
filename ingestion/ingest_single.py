import os
import sys
import logging
import json
from datetime import datetime

# Import local classes
from PRODUCTION_PDF_PARSER import PDFExtractor
from PRODUCTION_GROQ_STRUCTURER import GroqStructurer
from SUPABASE_DATABASE import SupabaseDatabase
from supabase_config import get_supabase_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def ingest_single_pdf(file_path):
    settings = get_supabase_settings()
    
    # Initialize components
    logger.info("🚀 Initializing components...")
    pdf_extractor = PDFExtractor()
    groq_structurer = GroqStructurer(groq_api_key=settings.groq_api_key)
    db = SupabaseDatabase()
    
    # 1. Extract PDF
    logger.info(f"📄 Extracting text from: {file_path}")
    extraction_results = pdf_extractor.extract_pdf(file_path)
    
    if not extraction_results or not extraction_results.get('pages'):
        logger.error("❌ Failed to extract text from PDF")
        return
    
    all_questions = []
    
    # 2. Process Page by Page (Single file, sequential for demo clarity)
    for page in extraction_results['pages']:
        page_num = page['page_number']
        text = page['text']
        
        if len(text.strip()) < 100:
            continue
            
        logger.info(f"🧠 Structuring page {page_num}...")
        questions = groq_structurer.structure_text(
            text=text,
            source_file=os.path.basename(file_path),
            source_page=page_num
        )
        
        if questions:
            logger.info(f"✅ Found {len(questions)} questions on page {page_num}")
            all_questions.extend(questions)
            
    if not all_questions:
        logger.warning("⚠️ No questions were extracted.")
        return

    # 3. Insert into Database
    logger.info(f"💾 Inserting {len(all_questions)} questions into Supabase...")
    
    # Add metadata
    for q in all_questions:
        q['exam_year'] = 2011 # Based on file name
        q['exam_type'] = "Group 4"
        q['ingested_at'] = datetime.utcnow().isoformat()
    
    success_count = db.insert_questions_batch(all_questions)
    logger.info(f"✨ Successfully ingested {success_count} questions!")

if __name__ == "__main__":
    pdf_path = r"c:\Users\user\Downloads\exact-match-screenshot-main\exact-match-screenshot-main\Questions\TNPSC-Group-4-2011-General-Tamil.pdf"
    ingest_single_pdf(pdf_path)
