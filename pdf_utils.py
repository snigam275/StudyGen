import sys
 
from pypdf import PdfReader
 
 
def extract_text(pdf_path: str) -> str:
    """Read a PDF file and return all of its text as one string."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text
 
 
# Quick test - run:  python pdf_utils.py yourfile.pdf
if __name__ == "__main__":
    path = sys.argv[1]
    content = extract_text(path)
    print(f"Read {len(content)} characters from {path}\n")
    print(content[:2000])  # show the first 2000 characters so you can eyeball it
 