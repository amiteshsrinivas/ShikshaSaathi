import { useChat } from '@/contexts/ChatContext';
import ChatMessage from '@/components/chat/ChatMessage';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function SavedQuestionsPage() {
  const { savedQuestions } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [openBlocks, setOpenBlocks] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    console.log('Current saved questions:', savedQuestions);
  }, [savedQuestions]);

  // Filter saved questions based on search query
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return savedQuestions;

    const query = searchQuery.toLowerCase();
    return savedQuestions.filter(block => 
      block.some(message => message.content.toLowerCase().includes(query))
    );
  }, [savedQuestions, searchQuery]);

  const toggleBlock = (index: number) => {
    setOpenBlocks(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getFirstQuestion = (block: any[]) => {
    const firstUserMessage = block.find(msg => msg.role === 'user');
    return firstUserMessage ? firstUserMessage.content : 'No question found';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Saved Questions</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search saved questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No saved questions yet. Save questions from the chat to see them here.
          </div>
        ) : (
          filteredQuestions.map((block, index) => (
            <Collapsible
              key={index}
              open={openBlocks[index]}
              onOpenChange={() => toggleBlock(index)}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 px-6 flex items-center justify-between text-left hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Question:</span>
                    <span className="font-medium">{getFirstQuestion(block)}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openBlocks[index] ? 'transform rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 p-4 border rounded-lg bg-muted/50">
                {block.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
} 