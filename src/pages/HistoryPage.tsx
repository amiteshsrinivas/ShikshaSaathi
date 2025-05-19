import { useChat } from '@/contexts/ChatContext';
import ChatMessage from '@/components/chat/ChatMessage';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function HistoryPage() {
  const { messages } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: typeof messages } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  }, [messages]);

  // Filter messages based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedMessages;

    const query = searchQuery.toLowerCase();
    const filtered: typeof groupedMessages = {};

    Object.entries(groupedMessages).forEach(([date, messages]) => {
      const filteredMessages = messages.filter(message => 
        message.content.toLowerCase().includes(query)
      );
      if (filteredMessages.length > 0) {
        filtered[date] = filteredMessages;
      }
    });

    return filtered;
  }, [groupedMessages, searchQuery]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Chat History</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(filteredGroups).map(([date, messages]) => (
          <div key={date}>
            <h2 className="text-lg font-semibold mb-4">{date}</h2>
            <div className="space-y-4">
              {messages.map(message => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
