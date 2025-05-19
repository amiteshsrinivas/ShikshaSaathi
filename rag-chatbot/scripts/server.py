from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
from urllib.parse import parse_qs, urlparse
import google.generativeai as genai
from dotenv import load_dotenv
import requests

# Load environment variables from .env file
load_dotenv()

# Add the scripts directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from scripts.query_rag import ask_question

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Gemini model
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
except Exception as e:
    print(f"Error initializing Gemini API: {str(e)}")
    raise

# Store conversation context
conversation_context = {}

# YouTube API configuration
YOUTUBE_API_KEY = #add your API key

@app.route('/systems', methods=['GET'])
def get_systems():
    try:
        systems = []
        for system_id in ['7th', '8th', '10th']:
            is_setup = os.path.exists(f"data/processed/{system_id}/index/faiss.index")
            systems.append({
                'id': system_id,
                'is_setup': is_setup
            })
        
        return jsonify({
            'status': 'success',
            'systems': systems
        })
    except Exception as e:
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

@app.route('/reset-context', methods=['POST'])
def reset_context():
    try:
        data = request.get_json()
        
        if 'system_id' in data:
            system_id = data['system_id']
            if system_id in conversation_context:
                del conversation_context[system_id]
        
        return jsonify({
            'status': 'success',
            'message': 'Conversation context reset successfully'
        })
    except Exception as e:
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

@app.route('/youtube-search', methods=['POST'])
def youtube_search():
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({
                'error': 'Invalid request. Please provide a search query'
            }), 400

        query = data['query']
        
        # Make request to YouTube API
        response = requests.get(
            f'https://www.googleapis.com/youtube/v3/search',
            params={
                'part': 'snippet',
                'maxResults': 4,
                'q': query,
                'type': 'video',
                'key': YOUTUBE_API_KEY
            }
        )

        if not response.ok:
            error_data = response.json()
            if response.status_code == 403:
                return jsonify({
                    'error': 'YouTube API access denied. Please check API key and enable YouTube Data API v3.'
                }), 403
            return jsonify({
                'error': f'Failed to fetch YouTube videos: {error_data.get("error", {}).get("message", "Unknown error")}'
            }), response.status_code

        data = response.json()
        
        if not data.get('items'):
            return jsonify({
                'videos': []
            })

        videos = [{
            'id': item['id']['videoId'],
            'title': item['snippet']['title'],
            'thumbnail': item['snippet']['thumbnails']['high']['url'],
            'channelTitle': item['snippet']['channelTitle'],
            'publishedAt': item['snippet']['publishedAt'],
            'url': f'https://www.youtube.com/watch?v={item["id"]["videoId"]}',
            'embedUrl': f'https://www.youtube.com/embed/{item["id"]["videoId"]}'
        } for item in data['items']]

        return jsonify({
            'videos': videos
        })

    except Exception as e:
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

@app.route('/get-top-doubts', methods=['GET'])
def get_top_doubts():
    try:
        # Create a prompt for getting top doubts
        prompt = """Based on common student questions and difficulties, provide the top 5 topics or concepts where students typically have doubts.
        Format each suggestion as a concise question or topic.
        Focus on fundamental concepts that are often misunderstood.
        
        Provide the response in this format:
        1. [First topic/question]
        2. [Second topic/question]
        3. [Third topic/question]
        4. [Fourth topic/question]
        5. [Fifth topic/question]"""

        try:
            response = model.generate_content(prompt)
            suggestions = response.text
        except Exception as e:
            suggestions = "Error generating suggestions: " + str(e)

        return jsonify({
            'status': 'success',
            'suggestions': suggestions
        })

    except Exception as e:
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

@app.route('/query', methods=['POST'])
def query():
    try:
        data = request.get_json()

        if not data or 'question' not in data or 'system_id' not in data:
            return jsonify({
                'error': 'Invalid request. Please provide both question and system_id'
            }), 400

        question = data['question']
        system_id = data['system_id']
        is_followup = data.get('is_followup', False)
        previous_questions = data.get('previous_questions', [])
        is_in_syllabus = data.get('is_in_syllabus', False)
        is_new_block = data.get('is_new_block', False)
        response_type = data.get('response_type')

        if not os.path.exists(f"data/processed/{system_id}/index/faiss.index"):
            return jsonify({
                'error': f'RAG system {system_id} is not set up'
            }), 404

        # Get or create conversation context
        if system_id not in conversation_context or is_new_block:
            conversation_context[system_id] = {
                'is_in_syllabus': False,
                'question_block': []
            }

        # Update context
        if is_new_block:
            conversation_context[system_id]['question_block'] = []
        conversation_context[system_id]['question_block'].append(question)
        if is_new_block:
            conversation_context[system_id]['is_in_syllabus'] = is_in_syllabus

        # If response type is math, get concise solving steps
        if response_type == 'math':
            # Create a prompt for concise math solving
            prompt = f"""Solve the following math problem step by step. Be concise and clear.
            Focus only on the essential steps and calculations.
            Format the response as a numbered list of steps.
            
            Problem: {question}
            
            Provide the solution in this format:
            1. Step 1
            2. Step 2
            ...
            Answer: [final answer]"""

            try:
                response = model.generate_content(prompt)
                answer = response.text
            except Exception as e:
                answer = f"Error solving math problem: {str(e)}"

            response = {
                'status': 'success',
                'system_id': system_id,
                'question': question,
                'answer': answer,
                'is_in_syllabus': conversation_context[system_id]['is_in_syllabus'],
                'response_type': response_type
            }
        # If response type is YouTube, get explanation from RAG and videos from YouTube API
        elif response_type == 'youtube':
            # Get explanation from RAG
            answer = ask_question(
                question, 
                system_id,
                is_followup=not is_new_block and len(conversation_context[system_id]['question_block']) > 1,
                previous_questions=[] if is_new_block else conversation_context[system_id]['question_block'][:-1],
                is_in_syllabus=conversation_context[system_id]['is_in_syllabus'],
                response_type='explain'  # Use explain type for the text response
            )

            # Get videos from YouTube API
            youtube_response = requests.get(
                f'https://www.googleapis.com/youtube/v3/search',
                params={
                    'part': 'snippet',
                    'maxResults': 4,
                    'q': question,
                    'type': 'video',
                    'key': YOUTUBE_API_KEY
                }
            )

            if youtube_response.ok:
                youtube_data = youtube_response.json()
                videos = [{
                    'id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'thumbnail': item['snippet']['thumbnails']['high']['url'],
                    'channelTitle': item['snippet']['channelTitle'],
                    'publishedAt': item['snippet']['publishedAt'],
                    'url': f'https://www.youtube.com/watch?v={item["id"]["videoId"]}',
                    'embedUrl': f'https://www.youtube.com/embed/{item["id"]["videoId"]}'
                } for item in youtube_data.get('items', [])]
            else:
                videos = []

            response = {
                'status': 'success',
                'system_id': system_id,
                'question': question,
                'answer': answer,
                'videos': videos,
                'is_in_syllabus': conversation_context[system_id]['is_in_syllabus'],
                'response_type': response_type
            }
        else:
            try:
                # Get answer with context and response type
                answer = ask_question(
                    question, 
                    system_id,
                    is_followup=not is_new_block and len(conversation_context[system_id]['question_block']) > 1,
                    previous_questions=[] if is_new_block else conversation_context[system_id]['question_block'][:-1],
                    is_in_syllabus=conversation_context[system_id]['is_in_syllabus'],
                    response_type=response_type
                )

                # Handle diagram response format
                if response_type == 'diagram' and isinstance(answer, dict):
                    response = {
                        'status': 'success',
                        'system_id': system_id,
                        'question': question,
                        'answer': answer['description'],
                        'image': answer['image'],
                        'is_in_syllabus': conversation_context[system_id]['is_in_syllabus'],
                        'response_type': response_type
                    }
                else:
                    response = {
                        'status': 'success',
                        'system_id': system_id,
                        'question': question,
                        'answer': answer,
                        'is_in_syllabus': conversation_context[system_id]['is_in_syllabus'],
                        'response_type': response_type
                    }
            except Exception as e:
                # If there's an error accessing the database, provide a fallback response
                response = {
                    'status': 'success',
                    'system_id': system_id,
                    'question': question,
                    'answer': "I apologize, but I'm having trouble accessing the database right now. Please try again in a moment.",
                    'is_in_syllabus': conversation_context[system_id]['is_in_syllabus'],
                    'response_type': response_type
                }

        return jsonify(response)

    except Exception as e:
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        data = request.get_json()
        
        if not data or 'chat_history' not in data:
            return jsonify({
                'error': 'Invalid request. Please provide chat_history'
            }), 400

        chat_history = data['chat_history']
        
        # Create a prompt for quiz generation
        prompt = f"""Based on the following conversation history, generate 5 multiple-choice questions that test understanding of the discussed topics.
        Each question MUST have EXACTLY 4 options and include an explanation for the correct answer.
        
        IMPORTANT FORMAT RULES:
        1. Each question MUST have exactly 4 options, no more and no less
        2. The correctAnswer must be an integer between 0 and 3 (representing the index of the correct option)
        3. Return ONLY the JSON array, without any markdown formatting or code block markers
        4. Each option should be a single, clear answer choice
        
        Format your response as a JSON array of question objects, where each object has:
        - id: a unique string identifier (q1, q2, etc.)
        - question: the question text
        - options: array of EXACTLY 4 possible answers
        - correctAnswer: index of the correct answer (0-3)
        - explanation: explanation of why the answer is correct

        Conversation History:
        {json.dumps(chat_history, indent=2)}

        Your response must be a valid JSON array that looks exactly like this:
        [
            {{
                "id": "q1",
                "question": "Question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,
                "explanation": "Explanation of why this is correct"
            }},
            // ... more questions ...
        ]"""

        # Generate quiz using Gemini
        try:
            response = model.generate_content(prompt)
            response_text = response.text
            
            # Log the response for debugging
            print("Gemini API Response:", response_text)
            
            # Clean up the response text
            # Remove markdown code block markers if present
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            
            # Try to parse the response as JSON
            try:
                quizzes = json.loads(response_text)
                
                # Validate the quiz format
                if not isinstance(quizzes, list):
                    raise ValueError("Response is not a list of questions")
                
                # Validate each quiz
                for i, quiz in enumerate(quizzes):
                    # Check required fields
                    required_fields = ['id', 'question', 'options', 'correctAnswer', 'explanation']
                    missing_fields = [field for field in required_fields if field not in quiz]
                    if missing_fields:
                        raise ValueError(f"Quiz {i+1} missing required fields: {missing_fields}")
                    
                    # Validate options
                    if not isinstance(quiz['options'], list):
                        raise ValueError(f"Quiz {i+1}: options must be a list")
                    if len(quiz['options']) != 4:
                        raise ValueError(f"Quiz {i+1}: must have exactly 4 options, got {len(quiz['options'])}")
                    
                    # Validate correctAnswer
                    if not isinstance(quiz['correctAnswer'], int):
                        raise ValueError(f"Quiz {i+1}: correctAnswer must be an integer")
                    if quiz['correctAnswer'] not in range(4):
                        raise ValueError(f"Quiz {i+1}: correctAnswer must be between 0 and 3")
                
                return jsonify({
                    'status': 'success',
                    'quizzes': quizzes
                })
                
            except json.JSONDecodeError as e:
                print("JSON Parse Error:", str(e))
                print("Raw Response:", response_text)
                # If JSON parsing fails, return mock quizzes
                return jsonify({
                    'status': 'success',
                    'quizzes': [
                        {
                            'id': 'q1',
                            'question': 'What is the capital of France?',
                            'options': ['London', 'Berlin', 'Paris', 'Madrid'],
                            'correctAnswer': 2,
                            'explanation': 'Paris is the capital city of France.'
                        },
                        {
                            'id': 'q2',
                            'question': 'Which planet is closest to the Sun?',
                            'options': ['Venus', 'Mercury', 'Mars', 'Earth'],
                            'correctAnswer': 1,
                            'explanation': 'Mercury is the closest planet to the Sun in our solar system.'
                        }
                    ]
                })
                
        except Exception as e:
            print("Gemini API Error:", str(e))
            return jsonify({
                'error': f'Error generating quiz: {str(e)}'
            }), 500

    except Exception as e:
        print("Server Error:", str(e))
        return jsonify({
            'error': f'An error occurred: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3100, debug=True) 
