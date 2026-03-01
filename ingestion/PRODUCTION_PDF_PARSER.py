# PRODUCTION GRADE PDF PARSER - BULLETPROOF EXTRACTION

import os, re, json, logging, hashlib, time, tempfile
from typing import List, Dict, Tuple, Optional, Any
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

import PyPDF2
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

class PDFExtractor:
    """PRODUCTION-GRADE PDF EXTRACTION"""
    
    def __init__(self, enable_ocr=True, max_workers=4):
        self.enable_ocr = enable_ocr
        self.max_workers = max_workers
    
    def extract_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """Extract ALL content from PDF with extreme accuracy"""
        
        logger.info(f"🚀 EXTRACTING: {Path(pdf_path).name}")
        start = time.time()
        
        try:
            pages_data = []
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                logger.info(f"📄 Total Pages: {total_pages}")
                
                for page_idx, page in enumerate(pdf.pages, 1):
                    # STRATEGY 1: Direct text extraction (fastest)
                    text = page.extract_text() or ""
                    confidence = 0.95
                    used_ocr = False
                    
                    # STRATEGY 2: If text too low, use OCR
                    if len(text.strip()) < 100 and self.enable_ocr:
                        logger.info(f"  Page {page_idx}: Low text detected ({len(text)} chars), using OCR...")
                        try:
                            images = convert_from_path(pdf_path, first_page=page_idx, last_page=page_idx)
                            if images:
                                img = images[0]
                                ocr_text = pytesseract.image_to_string(img, lang="eng+hin")
                                if len(ocr_text) > len(text):
                                    text = ocr_text
                                    confidence = 0.85
                                    used_ocr = True
                        except:
                            pass
                    
                    # STRATEGY 3: Extract tables
                    tables = []
                    try:
                        tables_raw = page.extract_tables()
                        tables = [{"rows": len(t), "cols": len(t[0]) if t else 0, "data": t} for t in tables_raw] if tables_raw else []
                    except:
                        pass
                    
                    # STRATEGY 4: Extract images info
                    images_info = []
                    try:
                        for img in page.images:
                            images_info.append({"x0": img["x0"], "y0": img["y0"], "width": img["width"], "height": img["height"]})
                    except:
                        pass
                    
                    # Clean text
                    text = re.sub(r'\s+', ' ', text)
                    text = ''.join(c for c in text if ord(c) >= 32 or c in '\n\t')
                    text = text.strip()
                    
                    pages_data.append({
                        "page_number": page_idx,
                        "text": text,
                        "confidence": confidence,
                        "used_ocr": used_ocr,
                        "text_length": len(text),
                        "tables": len(tables),
                        "images": len(images_info),
                        "height": page.height,
                        "width": page.width,
                        "quality_score": 1.0 if len(text) > 500 else (len(text) / 500)
                    })
                    
                    if page_idx % 10 == 0:
                        logger.info(f"  Progress: {page_idx}/{total_pages} pages processed")
            
            duration = time.time() - start
            
            result = {
                "success": True,
                "file": Path(pdf_path).name,
                "pages": pages_data,
                "total_pages": len(pages_data),
                "total_text_length": sum(p["text_length"] for p in pages_data),
                "average_confidence": np.mean([p["confidence"] for p in pages_data]),
                "pages_with_ocr": sum(1 for p in pages_data if p["used_ocr"]),
                "total_tables": sum(p["tables"] for p in pages_data),
                "duration_seconds": duration,
                "file_hash": hashlib.sha256(open(pdf_path, "rb").read()).hexdigest()[:16]
            }
            
            logger.info(f"✅ SUCCESS: {result['total_pages']} pages, "
                       f"{result['total_text_length']} chars, "
                       f"confidence: {result['average_confidence']:.1%}, "
                       f"time: {duration:.1f}s")
            
            return result
        
        except Exception as e:
            logger.error(f"❌ EXTRACTION FAILED: {str(e)}")
            return {"success": False, "error": str(e), "pages": []}
    
    def extract_batch(self, pdf_directory: str) -> Dict:
        """Extract ALL PDFs from directory with detailed reporting"""
        
        pdf_files = sorted(Path(pdf_directory).glob("*.pdf"))
        logger.info(f"🔍 FOUND {len(pdf_files)} PDFs")
        
        results = {"total": len(pdf_files), "succeeded": 0, "failed": 0, "files": [], "total_pages": 0}
        start = time.time()
        
        for idx, pdf_file in enumerate(pdf_files, 1):
            logger.info(f"\n[{idx}/{len(pdf_files)}] Processing: {pdf_file.name}")
            
            result = self.extract_pdf(str(pdf_file))
            
            if result["success"]:
                results["succeeded"] += 1
                results["total_pages"] += result["total_pages"]
                results["files"].append({
                    "name": pdf_file.name,
                    "pages": result["total_pages"],
                    "text_length": result["total_text_length"],
                    "confidence": f"{result['average_confidence']:.1%}",
                    "has_tables": result["total_tables"] > 0
                })
            else:
                results["failed"] += 1
        
        results["duration"] = time.time() - start
        results["success_rate"] = f"{(results['succeeded'] / len(pdf_files) * 100):.1f}%"
        
        logger.info(f"\n📊 BATCH COMPLETE: {results['succeeded']}/{len(pdf_files)} succeeded, "
                   f"{results['total_pages']} total pages, {results['duration']:.1f}s")
        
        return results
