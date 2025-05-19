import { useChat } from '@/contexts/ChatContext';
import ChatInput from '@/components/chat/ChatInput';
import ChatMessage from '@/components/chat/ChatMessage';
import { Button } from '@/components/ui/button';
import { PlusCircle, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';

export default function ChatPage() {
  const { currentBlock, loading, sendUserMessage, addQuestionSeparator, saveCurrentBlock } = useChat();
  const { user } = useAuth();
  const userName = user?.user_metadata?.first_name || user?.email || "";
  const [selectedGrade, setSelectedGrade] = useState(() => {
    // Try to get the saved grade from localStorage, default to '7th' if not found
    return localStorage.getItem('selectedGrade') || '7th';
  });

  // Save grade selection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedGrade', selectedGrade);
  }, [selectedGrade]);

  const handleSave = () => {
    if (currentBlock.length > 0) {
      saveCurrentBlock();
      toast.success('Question saved successfully!');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header with New Question and Save buttons */}
      <div className="flex justify-between items-center gap-2 px-4 py-2 border-b">
        <div className="flex items-center gap-4">
          <div className="text-lg font-semibold text-gray-700">
            {userName && `Welcome, ${userName}`}
          </div>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5th">5th</SelectItem>
              <SelectItem value="6th">6th</SelectItem>
              <SelectItem value="7th">7th</SelectItem>
              <SelectItem value="8th">8th</SelectItem>
              <SelectItem value="9th">9th</SelectItem>
              <SelectItem value="10th">10th</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          className="flex items-center gap-2 h-8 bg-green-500 hover:bg-green-600 text-white border-none"
          disabled={currentBlock.length === 0}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Save Question
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={addQuestionSeparator}
          className="flex items-center gap-2 h-8"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New Question
        </Button>
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentBlock.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
          </div>
        )}
      </div>

      {/* Fixed input box at bottom */}
      <div className="border-t px-4 py-2 bg-background">
        <ChatInput onSend={sendUserMessage} disabled={loading} />
      </div>
    </div>
  );
}