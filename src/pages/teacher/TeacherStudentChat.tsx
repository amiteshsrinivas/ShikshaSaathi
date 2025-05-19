import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Send, Paperclip, Smile } from 'lucide-react';

interface Message {
  id: string;
  sender: 'teacher' | 'student';
  content: string;
  timestamp: string;
  attachments?: string[];
}

interface Student {
  id: string;
  name: string;
  avatar?: string;
  lastActive: string;
  unreadCount: number;
}

export default function TeacherStudentChat() {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    // Mock data for demonstration
    setStudents([
      {
        id: '1',
        name: 'John Doe',
        lastActive: '2 minutes ago',
        unreadCount: 2
      },
      {
        id: '2',
        name: 'Jane Smith',
        lastActive: '5 minutes ago',
        unreadCount: 0
      },
      {
        id: '3',
        name: 'Mike Johnson',
        lastActive: '1 hour ago',
        unreadCount: 1
      }
    ]);

    setMessages([
      {
        id: '1',
        sender: 'student',
        content: 'Hello teacher, I have a question about the math assignment.',
        timestamp: '10:30 AM'
      },
      {
        id: '2',
        sender: 'teacher',
        content: 'Hi! Sure, what would you like to know?',
        timestamp: '10:31 AM'
      },
      {
        id: '3',
        sender: 'student',
        content: 'I\'m having trouble with question 3 in the algebra section.',
        timestamp: '10:32 AM'
      }
    ]);

    setLoading(false);
  }, []);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'teacher',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* Students List */}
        <Card className="w-80 p-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-4">Students</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                className="pl-10"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-4rem)]">
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                    selectedStudent === student.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setSelectedStudent(student.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.lastActive}</p>
                    </div>
                    {student.unreadCount > 0 && (
                      <div className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {student.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          {selectedStudent ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={students.find(s => s.id === selectedStudent)?.avatar} />
                    <AvatarFallback>
                      {students.find(s => s.id === selectedStudent)?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {students.find(s => s.id === selectedStudent)?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {students.find(s => s.id === selectedStudent)?.lastActive}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender === 'teacher'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'teacher' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-5 w-5 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a student to start chatting
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 