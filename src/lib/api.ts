import { ChatMessage, Quiz } from "./types";
import { toast } from "sonner";

type ResponseType = 'explain' | 'example' | '1M' | '2M' | '4M' | 'reasoning' | 'diagram' | 'youtube' | null;

// Track conversation context
let currentContext = {
  isInSyllabus: false,
  lastQuestion: '',
  questionBlock: [] as string[]
};

// Mock API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get bot response
const getBotResponse = async (message: string, file?: File | null): Promise<string> => {
  await delay(1000); // Simulate API call
  
  // Mock responses based on message content
  const lowerMessage = message.toLowerCase();
  
  if (file) {
    return `I've received your file "${file.name}". ${getMockResponse(lowerMessage)}`;
  }
  
  return getMockResponse(lowerMessage);
};

const getMockResponse = (message: string): string => {
  if (message.includes('hello') || message.includes('hi')) {
    return "Hello! How can I help you learn today?";
  }
  
  if (message.includes('math')) {
    return "I'd be happy to help you with math! What specific topic would you like to learn about?";
  }
  
  if (message.includes('science')) {
    return "Science is fascinating! Would you like to learn about physics, chemistry, or biology?";
  }
  
  if (message.includes('history')) {
    return "History is full of interesting stories! Which period or event would you like to explore?";
  }
  
  return "That's an interesting question! Let me help you understand this better.";
};

// Send message to RAG chatbot server
export const sendMessage = async (
  content: string, 
  file?: File | null, 
  responseType?: ResponseType,
  isNewBlock: boolean = false
): Promise<ChatMessage> => {
  try {
    // If it's a new block, reset the question block
    if (isNewBlock) {
      currentContext.questionBlock = [];
    }

    // Add current question to the block
    currentContext.questionBlock.push(content);

    const response = await fetch('http://localhost:3100/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: content,
        system_id: localStorage.getItem('selectedGrade') || '7th',
        is_followup: currentContext.questionBlock.length > 1,
        previous_questions: currentContext.questionBlock.slice(0, -1),
        is_in_syllabus: currentContext.isInSyllabus,
        is_new_block: isNewBlock,
        response_type: responseType
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response from server');
    }

    const data = await response.json();
    
    // Update context based on response
    currentContext.lastQuestion = content;

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: data.answer,
      timestamp: new Date().toISOString(),
      responseType: responseType,
      image: data.image,
      videos: data.videos
    };
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to get response from server');
    throw error;
  }
};

// Reset conversation context
export const resetContext = async () => {
  try {
    const response = await fetch('http://localhost:3100/reset-context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_id: localStorage.getItem('selectedGrade') || '7th'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to reset context');
    }

    // Reset local context
    currentContext = {
      isInSyllabus: false,
      lastQuestion: '',
      questionBlock: []
    };
  } catch (error) {
    console.error('Error resetting context:', error);
    toast.error('Failed to reset conversation context');
    throw error;
  }
};

// Generate a quiz based on chat history
export const generateQuiz = async (chatHistory: ChatMessage[]): Promise<Quiz[]> => {
  try {
    const response = await fetch('http://localhost:3100/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_history: chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate quiz');
    }

    const data = await response.json();
    return data.quizzes;
  } catch (error) {
    console.error('Error generating quiz:', error);
    // Fallback to mock quizzes if API call fails
    return [
      {
        id: 'q1',
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2,
        explanation: 'Paris is the capital city of France.'
      },
      {
        id: 'q2',
        question: 'Which planet is closest to the Sun?',
        options: ['Venus', 'Mercury', 'Mars', 'Earth'],
        correctAnswer: 1,
        explanation: 'Mercury is the closest planet to the Sun in our solar system.'
      }
    ];
  }
};
