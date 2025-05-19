# config.py
# Get your API key from https://makersuite.google.com/app/apikey
GOOGLE_API_KEY = "add your api key"
EMBED_MODEL = "all-MiniLM-L6-v2"
K = 5  # top chunks to retrieve

# RAG System Configuration
RAG_SYSTEMS = {
    "7th": {
        "name": "Class 7 Study Materials",
        "description": "Collection of Class 7 textbooks and study materials",
        "documents_dir": "data/documents/7th"
    },
    "8th": {
        "name": "Class 8 Study Materials",
        "description": "Collection of Class 8 textbooks and study materials",
        "documents_dir": "data/documents/8th"
    },
    "10th": {
        "name": "Class 10 Study Materials",
        "description": "Collection of Class 10 textbooks and study materials",
        "documents_dir": "data/documents/10th"
    }
}
# API Keys

OPENAI_API_KEY = "REMOVEDproj-YBrI_CPfd7ebiwje2aLRPOuH5RpieCZBN0oIvce5xv4uKpqXzUWPiA_jjG9nJdJGTbXbtmJoIZT3BlbkFJ9511cE2uQbEch68DfSfbHbIxI-8UwZSy4UUjw7dsAppOHpn85_PpZjDOCVQZdwDqdb5Qb1iawA"  # Replace with your actual OpenAI API key

VITE_SUPABASE_URL = "https://imganjoqxocebqrsokag.supabase.co"
VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZ2Fuam9xeG9jZWJxcnNva2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDMwNTQsImV4cCI6MjA2MzA3OTA1NH0.wpPvEbi-940853HrFWVbmPRezVj2HbjiB48VcAYBdtg"
