import os
import shutil
import glob
import sys
from config import RAG_SYSTEMS

# Add the scripts directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def setup_rag_system(system_id):
    """Set up a RAG system by creating necessary directories and processing all documents."""
    if system_id not in RAG_SYSTEMS:
        print(f"Error: RAG system '{system_id}' not found in configuration.")
        return False

    system = RAG_SYSTEMS[system_id]
    base_dir = f"data/processed/{system_id}"
    
    # Create necessary directories
    os.makedirs(base_dir, exist_ok=True)
    os.makedirs(f"{base_dir}/index", exist_ok=True)
    os.makedirs(system["documents_dir"], exist_ok=True)

    # Process all PDFs in the documents directory
    from scripts.extract_text import extract_text
    from scripts.chunk_text import chunk_text
    from scripts.embed_chunks import create_embeddings

    # Get all PDF files
    pdf_files = glob.glob(os.path.join(system["documents_dir"], "*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {system['documents_dir']}")
        print("Please add PDF files to the directory and try again.")
        return False

    # Process each PDF
    all_chunks = []
    for pdf_file in pdf_files:
        print(f"Processing {os.path.basename(pdf_file)}...")
        
        # Extract text
        text = extract_text(pdf_file)
        
        # Create chunks
        chunks = chunk_text(text)
        all_chunks.extend(chunks)

    # Save all chunks
    with open(f"{base_dir}/chunks.txt", "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(chunk + "\n---CHUNK---\n")

    # Create embeddings and index
    create_embeddings(f"{base_dir}/chunks.txt", f"{base_dir}/index")
    
    print(f"Successfully set up RAG system for {system['name']}")
    print(f"Processed {len(pdf_files)} PDF files")
    return True

def list_available_systems():
    """List all available RAG systems and their PDF files."""
    print("\nAvailable RAG Systems:")
    print("-" * 50)
    for system_id, system in RAG_SYSTEMS.items():
        # Check if system is set up
        is_setup = os.path.exists(f"data/processed/{system_id}/index/faiss.index")
        status = "✓ Set up" if is_setup else "✗ Not set up"
        
        # Get PDF files
        pdf_files = glob.glob(os.path.join(system["documents_dir"], "*.pdf"))
        
        print(f"ID: {system_id}")
        print(f"Name: {system['name']}")
        print(f"Description: {system['description']}")
        print(f"Status: {status}")
        print("\nPDF Files:")
        if pdf_files:
            for pdf in pdf_files:
                print(f"  - {os.path.basename(pdf)}")
        else:
            print("  No PDF files added yet")
        print("-" * 50)

def add_pdf_to_system(system_id, pdf_path):
    """Add a new PDF to a RAG system."""
    if system_id not in RAG_SYSTEMS:
        print(f"Error: RAG system '{system_id}' not found in configuration.")
        return False

    system = RAG_SYSTEMS[system_id]
    docs_dir = system["documents_dir"]
    
    # Create documents directory if it doesn't exist
    os.makedirs(docs_dir, exist_ok=True)
    
    # Copy PDF to documents directory
    pdf_name = os.path.basename(pdf_path)
    target_path = os.path.join(docs_dir, pdf_name)
    
    try:
        shutil.copy2(pdf_path, target_path)
        print(f"Successfully added {pdf_name} to {system['name']}")
        return True
    except Exception as e:
        print(f"Error adding PDF: {str(e)}")
        return False

def main():
    while True:
        print("\nRAG System Manager")
        print("1. List available systems")
        print("2. Set up/Update a system")
        print("3. Add PDF to a system")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ")
        
        if choice == "1":
            list_available_systems()
        elif choice == "2":
            list_available_systems()
            system_id = input("\nEnter the ID of the system you want to set up/update: ")
            setup_rag_system(system_id)
        elif choice == "3":
            list_available_systems()
            system_id = input("\nEnter the ID of the system to add PDF to: ")
            pdf_path = input("Enter the full path to the PDF file: ")
            if add_pdf_to_system(system_id, pdf_path):
                update = input("Do you want to update the system now? (y/n): ")
                if update.lower() == 'y':
                    setup_rag_system(system_id)
        elif choice == "4":
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main() 