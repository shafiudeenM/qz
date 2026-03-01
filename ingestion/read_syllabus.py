import pdfplumber

pdfs = {
    "Group 4": r"c:\Users\user\Downloads\exact-match-screenshot-main\exact-match-screenshot-main\syallbus\GROUP 4 SYALLBUS.pdf",
    "Group 2": r"c:\Users\user\Downloads\exact-match-screenshot-main\exact-match-screenshot-main\syallbus\GROUP 2 AND 2A SYLLABYS.pdf",
    "Group 1": r"c:\Users\user\Downloads\exact-match-screenshot-main\exact-match-screenshot-main\syallbus\GROUP 1 SYLLABUS.pdf",
}

for name, path in pdfs.items():
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")
    try:
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages[:8]):  # First 8 pages
                text = page.extract_text()
                if text:
                    print(f"\n--- Page {i+1} ---")
                    print(text[:3000])
    except Exception as e:
        print(f"Error: {e}")
