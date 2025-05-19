import os
import pickle
import faiss
from sentence_transformers import SentenceTransformer
from config import EMBED_MODEL

def create_embeddings(chunks_file, output_dir):
    """Create embeddings and FAISS index from chunks file."""
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Read chunks from text file
    chunks = []
    with open(chunks_file, "r", encoding="utf-8") as f:
        content = f.read()
        chunks = content.split("\n---CHUNK---\n")
        chunks = [chunk.strip() for chunk in chunks if chunk.strip()]

    # Save chunks to pickle file
    with open(os.path.join(output_dir, "chunks.pkl"), "wb") as f:
        pickle.dump(chunks, f)

    # Embed
    model = SentenceTransformer(EMBED_MODEL)
    embeddings = model.encode(chunks)

    # Save embeddings
    with open(os.path.join(output_dir, "embeddings.pkl"), "wb") as f:
        pickle.dump(embeddings, f)

    # Create FAISS index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    # Save FAISS index
    faiss.write_index(index, os.path.join(output_dir, "faiss.index"))
    
    print(f"Created embeddings and index for {len(chunks)} chunks")

if __name__ == "__main__":
    # Test the function
    create_embeddings("data/chunks.txt", "index")
