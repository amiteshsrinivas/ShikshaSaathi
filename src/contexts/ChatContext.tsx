import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatMessage, Quiz } from '@/lib/types';
import { sendMessage, generateQuiz } from '@/lib/api';
import { saveChatMessage, getChatHistory, saveQuestion, getSavedQuestions, getChatHistoryForQuiz } from '@/integrations/supabase/chat';

type ResponseType = 'explain' | 'example' | '1M' | '2M' | '4M' | 'reasoning' | 'diagram' | 'youtube' | null;

interface ChatContextProps {
  messages: ChatMessage[];
  currentBlock: ChatMessage[];
  loading: boolean;
  quizzes: Quiz[];
  quizLoading: boolean;
  savedQuestions: ChatMessage[][];
  voiceSessionMessages: ChatMessage[];
  sendUserMessage: (message: string, file?: File | null, responseType?: ResponseType) => Promise<void>;
  loadQuizzes: () => Promise<void>;
  addQuestionSeparator: () => void;
  saveCurrentBlock: () => Promise<void>;
  startVoiceSession: () => void;
  endVoiceSession: () => void;
  sendVoiceMessage: (message: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentBlock, setCurrentBlock] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [savedQuestions, setSavedQuestions] = useState<ChatMessage[][]>([]);
  const [voiceSessionMessages, setVoiceSessionMessages] = useState<ChatMessage[]>([]);
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false);

  // Load messages and saved questions from Supabase on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [chatHistory, savedQuestionsData] = await Promise.all([
          getChatHistory(false),
          getSavedQuestions()
        ]);
        
        setMessages(chatHistory);
        setSavedQuestions(savedQuestionsData.map(q => q.messages));
      } catch (error) {
        console.error('Failed to load chat data:', error);
      }
    };
    
    loadData();
  }, []);

  const addQuestionSeparator = () => {
    const separator: ChatMessage = {
      id: Date.now().toString(),
      role: 'separator',
      content: 'New Question',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, separator]);
    setCurrentBlock([]); // Clear current block when starting new question
  };

  const saveCurrentBlock = async () => {
    if (currentBlock.length > 0) {
      try {
        await saveQuestion(currentBlock);
        const updatedQuestions = await getSavedQuestions();
        setSavedQuestions(updatedQuestions.map(q => q.messages));
      addQuestionSeparator(); // Add separator after saving
      } catch (error) {
        console.error('Error saving question:', error);
      }
    }
  };

  const startVoiceSession = async () => {
    setIsVoiceSessionActive(true);
    try {
      const voiceHistory = await getChatHistory(true);
      setVoiceSessionMessages(voiceHistory);
    } catch (error) {
      console.error('Error loading voice session history:', error);
      setVoiceSessionMessages([]);
    }
  };

  const endVoiceSession = () => {
    setIsVoiceSessionActive(false);
    setVoiceSessionMessages([]);
  };

  const sendVoiceMessage = async (content: string) => {
    if (!isVoiceSessionActive) {
      startVoiceSession();
    }

    try {
      setLoading(true);
      
      // Add user message to voice session
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      };
      
      // Save user message to Supabase
      await saveChatMessage(userMessage, true);
      setVoiceSessionMessages(prev => [...prev, userMessage]);
      
      // Get bot response
      const botResponse = await sendMessage(content, null, null, false);
      
      // Save bot response to Supabase
      await saveChatMessage(botResponse, true);
      setVoiceSessionMessages(prev => [...prev, botResponse]);

      // Function to speak the response
      const speakResponse = () => {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Create new speech utterance
        const speech = new SpeechSynthesisUtterance(botResponse.content.replace(/\*/g, ''));
        
        // Set voice properties
        speech.volume = 1;
        speech.rate = 1;
        speech.pitch = 1;
        speech.lang = 'kn-IN'; // Set language to Kannada

        // Get available voices
        const voices = window.speechSynthesis.getVoices();
        
        // Find Kannada voice
        const kannadaVoice = voices.find(voice => voice.lang === 'kn-IN');
        if (kannadaVoice) {
          speech.voice = kannadaVoice;
        }

        // Speak the response
        window.speechSynthesis.speak(speech);
      };

      // Handle voice loading
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          speakResponse();
        };
      } else {
        speakResponse();
      }

    } catch (error) {
      console.error('Error sending voice message:', error);
      // Add error message to voice session
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      };
      setVoiceSessionMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Add cleanup for speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const sendUserMessage = async (content: string, file?: File | null, responseType?: ResponseType) => {
    try {
      setLoading(true);
      
      // Check if this is a new question block
      const isNewBlock = messages.length > 0 && messages[messages.length - 1].role === 'separator';
      
      // Add user message to state
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        file: file ? {
          name: file.name,
          type: file.type,
          size: file.size
        } : undefined
      };
      
      // Save user message to Supabase
      await saveChatMessage(userMessage);
      
      // Update both full history and current block
      setMessages(prev => [...prev, userMessage]);
      setCurrentBlock(prev => [...prev, userMessage]);
      
      // Get bot response
      const botResponse = await sendMessage(content, file, responseType, isNewBlock);
      
      // Save bot response to Supabase
      await saveChatMessage(botResponse);
      
      // Update both full history and current block
      setMessages(prev => [...prev, botResponse]);
      setCurrentBlock(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzes = async () => {
    try {
      setQuizLoading(true);
      // Get recent chat history for quiz generation
      const recentConversations = await getChatHistoryForQuiz(50);
      
      // Flatten conversations into a single array of messages
      const recentMessages = recentConversations.flat();
      
      // Generate quizzes based on recent chat history
      const newQuizzes = await generateQuiz(recentMessages);
      setQuizzes(newQuizzes);
    } catch (error) {
      console.error('Error generating quizzes:', error);
    } finally {
      setQuizLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        currentBlock,
        loading,
        quizzes,
        quizLoading,
        savedQuestions,
        voiceSessionMessages,
        sendUserMessage,
        loadQuizzes,
        addQuestionSeparator,
        saveCurrentBlock,
        startVoiceSession,
        endVoiceSession,
        sendVoiceMessage
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
