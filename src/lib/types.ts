export type ResponseType = 'explain' | 'example' | '1M' | '2M' | '4M' | 'reasoning' | 'diagram' | 'youtube' | null;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'separator';
  content: string;
  timestamp: string;
  file?: {
    name: string;
    type: string;
    size: number;
  };
  responseType?: ResponseType;
  image?: string; // Base64 encoded image data
  videos?: {
    title: string;
    url: string;
  }[];
}

export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic?: string;
  selectedAnswer?: number;
}
