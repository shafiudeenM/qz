from pdf2image import convert_from_path
import os

pdf_path = r"c:\Users\user\Downloads\exact-match-screenshot-main\exact-match-screenshot-main\Questions\TNPSC-Group-4-2011-General-Tamil.pdf"
try:
    images = convert_from_path(pdf_path, first_page=1, last_page=1)
    print(f"✅ Success: {len(images)} images created")
except Exception as e:
    print(f"❌ Error: {str(e)}")
