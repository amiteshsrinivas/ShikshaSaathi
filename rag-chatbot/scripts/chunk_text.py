# scripts/chunk_text.py
def chunk_text(text, max_words=100):
    """Split text into chunks of maximum size."""
    paras = text.split("\n\n")
    chunks = []
    chunk = ""

    for para in paras:
        if len((chunk + para).split()) < max_words:
            chunk += para + "\n\n"
        else:
            chunks.append(chunk.strip())
            chunk = para + "\n\n"
    if chunk:
        chunks.append(chunk.strip())

    return chunks

if __name__ == "__main__":
    # Test the function
    with open("data/full_text.txt", 'r', encoding='utf-8') as f:
        text = f.read()
    chunks = chunk_text(text)
    print(f"Created {len(chunks)} chunks")
