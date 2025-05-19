import { ChatMessage as ChatMessageType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { formatDistance, format } from 'date-fns';
import { PaperclipIcon, PlayIcon } from 'lucide-react';
import { User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const isSeparator = message.role === 'separator';
  const isAssistant = message.role === 'assistant';
  let timeAgo = '';
  
  try {
    timeAgo = formatDistance(new Date(message.timestamp), new Date(), { addSuffix: true });
  } catch (error) {
    timeAgo = 'unknown time';
  }

  const handleVideoClick = (url: string) => {
    window.open(url, '_blank');
  };

  if (isSeparator) {
    return (
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 border-t border-border" />
        <div className="text-sm text-muted-foreground">
          {format(new Date(message.timestamp), 'MMM d, h:mm a')}
        </div>
        <div className="flex-1 border-t border-border" />
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-edu-blue text-white' : 'bg-muted'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
          <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? 'You' : isAssistant ? 'Assistant' : 'Bot'}
          </span>
            {isUser && (
              <span className="text-xs text-gray-500">
                (Grade {localStorage.getItem('selectedGrade') || '7th'})
              </span>
            )}
          </div>
        </div>
        
        <div className={`rounded-lg p-4 ${
          isUser 
            ? 'bg-edu-blue text-white' 
            : 'bg-muted'
        }`}>
          <p className="whitespace-pre-wrap">{message.content.replace(/\*/g, '')}</p>
          
          {/* Display diagram image if available */}
          {message.responseType === 'diagram' && message.image && (
            <div className="mt-4">
              <img 
                src={`data:image/png;base64,${message.image}`}
                alt="Generated diagram"
                className="max-w-full rounded-lg shadow-md"
              />
            </div>
          )}
          
          {/* Display YouTube videos if available */}
          {message.responseType === 'youtube' && message.videos && message.videos.length > 0 && (
            <div className="mt-4 space-y-3">
              {message.videos.map((video, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full flex items-center gap-2 justify-start bg-white hover:bg-gray-50"
                  onClick={() => handleVideoClick(video.url)}
                >
                  <PlayIcon className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-gray-700">{video.title}</span>
                </Button>
              ))}
            </div>
          )}
          
          {/* Display attached file if available */}
          {message.file && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <PaperclipIcon className="w-4 h-4" />
              <span>{message.file.name}</span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {formatDistance(new Date(message.timestamp), new Date(), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
