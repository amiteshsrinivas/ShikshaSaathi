# scripts/extract_text.py
import fitz

def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

if __name__ == "__main__":
    path = "data/class7_science.pdf"
    text = extract_text(path)

    with open("data/full_text.txt", "w", encoding="utf-8") as f:
        f.write(text)
