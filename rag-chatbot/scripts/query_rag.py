import google.generativeai as genai
from config import GOOGLE_API_KEY, K, RAG_SYSTEMS
import faiss
import pickle
import os
import glob
import numpy as np
from sentence_transformers import SentenceTransformer, util
import base64
from PIL import Image
import io
import requests

# Initialize Google Gemini
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')
image_model = genai.GenerativeModel('gemini-2.0-flash')

# Load embedding model with lower memory usage
embed_model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

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

def generate_diagram_image(description: str, question: str, system_id: str) -> str:
    """Generate an image based on the diagram description using Gemini."""
    try:
        # Extract class level from system_id (e.g., '7th', '8th', '10th')
        class_level = system_id.replace('th', 'th grade')
        
        # Create a prompt for image generation
        prompt = f"""Create a labeled educational diagram for {class_level} students about {question}. 
        The diagram should be clear, well-labeled, and include all necessary components from this description: {description}.
        Style: Educational diagram with white background, clear labels, simple and clean design, age-appropriate for {class_level} students.
        Make it professional looking with a title and all necessary labels."""
        
        # Generate image using Gemini
        response = image_model.generate_content(prompt)
        
        # Get the image data
        if response.image:
            # Convert the image to base64
            image_bytes = response.image
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            return base64_image
        else:
            print("No image generated")
            return None
            
    except Exception as e:
        print(f"Error generating diagram image: {str(e)}")
        return None

def get_response_prompt(response_type: str, question: str, context: str, system_name: str) -> str:
    """Generate appropriate prompt based on response type."""
    base_prompt = f"""You are a helpful and knowledgeable teacher. Answer the following question in a clear, direct, and engaging way.

Question: {question}

Relevant Information:
{context}

Instructions:"""

    if response_type == 'math':
        return f"""You are a helpful math tutor. Solve the following math problem step by step:

Question: {question}

Instructions:
1. Break down the solution into clear, numbered steps
2. Show all calculations and work
3. Explain each step in simple terms
4. Include any relevant formulas or concepts used
5. Double-check your work for accuracy
6. Provide the final answer clearly
7. If there are multiple methods to solve, show the most straightforward approach first

Please provide a detailed, step-by-step solution that would help a student understand how to solve similar problems."""

    elif response_type == 'explain':
        return f"{base_prompt}\nProvide a clear and engaging explanation in approximately 300 words. Break down complex ideas into simpler parts and use clear examples to illustrate your points. Write in a conversational, teacher-like tone without using phrases like 'according to the textbook' or 'as mentioned in the material'."
    
    elif response_type == 'example':
        return f"{base_prompt}\nProvide 2-3 practical examples that demonstrate the concept. Make sure the examples are clear, relevant, and help in understanding the concept better. Write in a natural, teaching style."
    
    elif response_type == '1M':
        return f"{base_prompt}\nProvide a concise answer in exactly 40 words. Focus on the most important points only. Write in a clear, direct style."
    
    elif response_type == '2M':
        return f"{base_prompt}\nProvide a detailed answer in exactly 100 words. Include key points and brief explanations. Write in a natural, teaching style."
    
    elif response_type == '4M':
        return f"{base_prompt}\nProvide a comprehensive answer in exactly 200 words. Include detailed explanations and relevant examples. Write in a clear, engaging style."
    
    elif response_type == 'reasoning':
        return f"{base_prompt}\nExplain the reasoning behind the concept. Break down the logical steps and explain why things work the way they do. Write in a natural, teaching style."
    
    elif response_type == 'diagram':
        return f"{base_prompt}\nGenerate a detailed description of a diagram that would help explain this concept. Include all necessary labels, components, and relationships. The description should be specific enough to create an accurate visual representation."
    
    elif response_type == 'youtube':
        return f"""{base_prompt}
        You must respond with a JSON object containing two fields:
        1. "description": A 200-word explanation of the concept
        2. "videos": An array of 2-3 video objects, each with "title" and "url" fields

        Your response must be a valid JSON object that looks exactly like this:
        {{
            "description": "Your 200-word explanation here",
            "videos": [
                {{
                    "title": "Title of first video",
                    "url": "https://www.youtube.com/watch?v=VIDEO_ID1"
                }},
                {{
                    "title": "Title of second video",
                    "url": "https://www.youtube.com/watch?v=VIDEO_ID2"
                }}
            ]
        }}

        Important:
        - The response must be a single valid JSON object
        - Include exactly 2-3 video links
        - Each video must have both a title and a valid YouTube URL
        - The description should be exactly 200 words
        - Do not include any text outside the JSON object"""
    
    else:
        return f"{base_prompt}\nProvide a clear and educational answer that helps the student understand the concept. Write in a natural, teaching style without referencing the source material directly."

def detect_and_translate(text: str) -> tuple[str, str]:
    """Detect language and translate to English if needed."""
    try:
        # Use Gemini to detect language and translate
        prompt = f"""Detect the language of this text and translate it to English if it's not already in English.
        Text: {text}
        
        Respond in this exact format:
        Language: [detected language code]
        Translation: [translated text]"""
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Parse the response
        lines = response_text.split('\n')
        lang_line = next((line for line in lines if line.startswith('Language:')), 'Language: en')
        trans_line = next((line for line in lines if line.startswith('Translation:')), f'Translation: {text}')
        
        source_lang = lang_line.split(':')[1].strip()
        translated_text = trans_line.split(':')[1].strip()
        
        return translated_text, source_lang
    except Exception as e:
        print(f"Translation error: {str(e)}")
        return text, 'en'  # Default to English if translation fails

def translate_response(text: str, target_lang: str) -> str:
    """Translate response back to original language."""
    try:
        if target_lang == 'en':
            return text
        
        # Use Gemini to translate back to original language
        prompt = f"""Translate this text to {target_lang}:
        Text: {text}"""
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Translation error: {str(e)}")
        return text  # Return original text if translation fails

def ask_question(question, system_id, is_followup=False, previous_questions=None, is_in_syllabus=False, response_type=None):
    """Ask a question to a specific RAG system."""
    if system_id not in RAG_SYSTEMS:
        return "Error: Invalid RAG system ID"
    
    # Detect language and translate question to English
    translated_question, source_lang = detect_and_translate(question)
    
    system = RAG_SYSTEMS[system_id]
    base_dir = f"data/processed/{system_id}"
    
    # Check if system is set up
    if not os.path.exists(f"{base_dir}/index/faiss.index"):
        return f"Error: RAG system '{system['name']}' is not set up. Please set it up first using manage_rag.py"

    try:
        # If response type is math, handle it directly without textbook context
        if response_type == 'math':
            prompt = get_response_prompt(response_type, translated_question, "", system['name'])
            response = model.generate_content(prompt)
            translated_response = translate_response(response.text, source_lang)
            return translated_response

        # If response type is youtube, handle it separately
        elif response_type == 'youtube':
            # Get the explanation and video links
            prompt = get_response_prompt(response_type, translated_question, "", system['name'])
            response = model.generate_content(prompt)
            
            try:
                # Parse the response as JSON
                import json
                # First, try to find JSON in the response text
                text = response.text
                # Look for JSON-like structure
                start_idx = text.find('{')
                end_idx = text.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = text[start_idx:end_idx]
                    result = json.loads(json_str)
                    
                    # Translate description back to original language
                    translated_description = translate_response(result['description'], source_lang)
                    
                    return {
                        'description': translated_description,
                        'videos': result['videos']  # Keep video titles in English
                    }
                else:
                    # If no JSON found, return the text as description
                    translated_text = translate_response(text, source_lang)
                    return {
                        'description': translated_text,
                        'videos': []
                    }
            except Exception as e:
                print(f"Error parsing YouTube response: {str(e)}")
                # If JSON parsing fails, return a simple response
                translated_text = translate_response(response.text, source_lang)
                return {
                    'description': translated_text,
                    'videos': []
                }

        # If response type is diagram, generate directly without textbook context
        elif response_type == 'diagram':
            # Generate a description first
            description_prompt = f"""You are a helpful educational assistant. Create a detailed visual description for a diagram that would help explain this concept to a {system_id} student.

Question: {translated_question}

The description should:
1. Focus on visual elements that can be drawn
2. Specify the layout and arrangement of components
3. List all labels and text that should appear
4. Describe any arrows, lines, or connections needed
5. Mention colors or visual styles that would help understanding
6. Keep it simple and clear for {system_id} students
7. Include a suggested title for the diagram
"""
            description_response = model.generate_content(description_prompt)
            description = description_response.text

            # Generate image based on the description
            image_base64 = generate_diagram_image(description, translated_question, system_id)
            if image_base64:
                # Return both the description and the image
                return {
                    'description': translate_response(description, source_lang),
                    'image': image_base64
                }
            else:
                return translate_response(description, source_lang)

        # For other response types, use RAG
        else:
            # Load the FAISS index and document store
            index = faiss.read_index(f"{base_dir}/index/faiss.index")
            with open(f"{base_dir}/index/chunks.pkl", 'rb') as f:
                document_store = pickle.load(f)

            # Get question embedding
            question_embedding = embed_model.encode([translated_question])[0]

            # Search for similar documents
            D, I = index.search(np.array([question_embedding]), K)
            
            # Get the most relevant documents
            relevant_docs = [document_store[i] for i in I[0]]
            
            # Combine the context from relevant documents
            context = "\n".join(relevant_docs)
            
            # Generate response using the context
            prompt = get_response_prompt(response_type, translated_question, context, system['name'])
            response = model.generate_content(prompt)
            
            # Translate response back to original language
            translated_response = translate_response(response.text, source_lang)
            return translated_response

    except Exception as e:
        print(f"Error in ask_question: {str(e)}")
        return f"Error: {str(e)}"

def main():
    while True:
        print("\nRAG Chatbot")
        print("1. List available systems")
        print("2. Ask a question")
        print("3. Exit")
        
        choice = input("\nEnter your choice (1-3): ")
        
        if choice == "1":
            list_available_systems()
        elif choice == "2":
            list_available_systems()
            system_id = input("\nEnter the ID of the system you want to query: ")
            question = input("\nAsk your question: ")
            answer = ask_question(question, system_id)
            print("\nAnswer:", answer)
        elif choice == "3":
            break
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
