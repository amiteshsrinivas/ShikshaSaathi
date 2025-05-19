import { useState, FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendIcon, PaperclipIcon, YoutubeIcon, Sparkles, Calculator } from 'lucide-react';
import { Card } from '@/components/ui/card';
import EmojiPicker from './EmojiPicker';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  disabled?: boolean;
  onSend: (message: string, file?: File | null, responseType?: ResponseType) => Promise<void>;
}

type ResponseType = 'explain' | 'example' | '1M' | '2M' | '4M' | 'reasoning' | 'diagram' | 'youtube' | 'math' | null;

const ChatInput = ({ disabled, onSend }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [activeButton, setActiveButton] = useState<ResponseType>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !attachedFile) || loading || disabled) return;
    
    setLoading(true);
    try {
      await onSend(message, attachedFile, activeButton);
      setMessage('');
      setAttachedFile(null);
      setActiveButton(null);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = (type: ResponseType) => {
    setActiveButton(prev => prev === type ? null : type);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const getButtonLabel = (type: ResponseType): string => {
    switch (type) {
      case 'explain': return 'Explain';
      case 'example': return 'Example';
      case '1M': return '1M';
      case '2M': return '2M';
      case '4M': return '4M';
      case 'reasoning': return 'Reasoning';
      case 'diagram': return 'Diagram';
      case 'youtube': return 'YouTube';
      case 'math': return 'Math';
      default: return '';
    }
  };

  return (
    <Card className="p-3 shadow-lg border border-gray-200 bg-white">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            placeholder={activeButton === 'math' ? "Enter your math problem..." : "Ask any educational question..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="pr-24 pl-24 h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-[15px]"
            disabled={loading || disabled}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full hover:bg-gray-100 ${attachedFile ? 'text-blue-500' : 'text-gray-500'}`}
                disabled={loading || disabled}
                onClick={() => fileInputRef.current?.click()}
              >
                <PaperclipIcon className="h-4 w-4" />
              </Button>
            </motion.div>
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Button 
              type="submit" 
              size="icon"
              disabled={(!message.trim() && !attachedFile) || loading || disabled}
              className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              <SendIcon className="h-4 w-4 text-white" />
            </Button>
          </motion.div>
        </div>
        
        <AnimatePresence>
          {attachedFile && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg"
            >
              <PaperclipIcon className="h-4 w-4 text-blue-500" />
              <span className="text-blue-700">{attachedFile.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                onClick={() => setAttachedFile(null)}
              >
                Remove
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex flex-wrap gap-2">
          {(['explain', 'example', '1M', '2M', '4M', 'reasoning', 'diagram', 'youtube', 'math'] as ResponseType[]).map((type) => (
            <motion.div
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleButtonClick(type)}
                className={`h-7 px-3 text-xs rounded-full transition-all duration-200 ${
                  activeButton === type 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                disabled={loading || disabled}
              >
                {type === 'youtube' ? (
                  <div className="flex items-center gap-1.5">
                    <YoutubeIcon className="h-3.5 w-3.5" />
                    <span>YouTube</span>
                  </div>
                ) : type === 'diagram' ? (
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{getButtonLabel(type)}</span>
                  </div>
                ) : type === 'math' ? (
                  <div className="flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5" />
                    <span>Math</span>
                  </div>
                ) : (
                  getButtonLabel(type)
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </form>
    </Card>
  );
};

export default ChatInput;
