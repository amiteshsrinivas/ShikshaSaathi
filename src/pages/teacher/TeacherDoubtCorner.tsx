import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Debug logging utility
const debug = {
  log: (message: string, data?: any) => {
    console.log(`[DEBUG] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  }
};

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type Student = Database['public']['Tables']['students']['Row'];

type Message = {
  id: string;
  studentId: string;
  studentName: string;
  content: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'rejected';
};

type TopicAnalysis = {
  topic: string;
  count: number;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'low' | 'medium' | 'high';
  description: string;
};

export default function TeacherDoubtCorner() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicAnalysis, setTopicAnalysis] = useState<TopicAnalysis[]>([]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      debug.log('Starting to fetch messages...');

      // First, let's check if we can access the table at all
      const { count, error: countError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        debug.error('Error accessing chat_messages table:', countError);
        throw new Error(`Cannot access chat_messages table: ${countError.message}`);
      }

      debug.log('Total messages in table:', count);

      // Now fetch the actual messages
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('role', 'user')
        .order('timestamp', { ascending: false });

      if (error) {
        debug.error('Error fetching messages:', error);
        throw error;
      }

      debug.log('Raw messages from database:', data);

      if (!data || data.length === 0) {
        debug.warn('No messages found in database');
        setError('No student messages found. Please try sending a message first.');
        return;
      }

      // Log the structure of the first message to verify fields
      if (data.length > 0) {
        debug.log('First message structure:', {
          id: data[0].id,
          user_id: data[0].user_id,
          role: data[0].role,
          content: data[0].content,
          timestamp: data[0].timestamp
        });
      }

      // Convert to our format
      const messagesList = data.map(msg => ({
        id: msg.id,
        studentId: msg.user_id || '',
        studentName: 'Student',
        content: msg.content,
        timestamp: msg.timestamp,
        status: 'pending' as const
      }));

      debug.log('Processed messages:', messagesList);
      setMessages(messagesList);

      // Analyze topics using Gemini
      try {
        debug.log('Analyzing topics with Gemini...');
        
        const response = await fetch('http://localhost:3100/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: `You are a topic analyzer. Your task is to identify the top 5 topics that students are struggling with from the given messages.

IMPORTANT: Group similar questions into broader topics. For example:
- Questions about "constitution", "parliament", "government" should be grouped under "Civics"
- Questions about "algebra", "equations", "inequalities" should be grouped under "Algebra"
- Questions about "rocks", "sediments", "earth layers" should be grouped under "Earth Science"

REQUIRED FORMAT - You must follow this exact format for each topic:
Topic: [broad topic name]
Students: [total number of students with questions in this topic]
Difficulty: [easy/medium/hard]
Priority: [low/medium/high]
Description: [brief description of the topic and common questions]

Example response:
Topic: Algebra
Students: 5 students
Difficulty: medium
Priority: high
Description: Students are struggling with solving linear equations and inequalities.

Topic: Earth Science
Students: 3 students
Difficulty: hard
Priority: medium
Description: Students need help understanding rock cycles and sedimentation.

DO NOT include any other text, explanations, or formatting. Only list the topics in the exact format above.

Here are the messages to analyze:
${messagesList.map(msg => `[${msg.timestamp}] Student ${msg.studentName}: ${msg.content}`).join('\n')}`,
            system_id: '7th',
            is_followup: false,
            previous_questions: [],
            is_in_syllabus: false,
            is_new_block: true,
            response_type: 'explain'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze topics');
        }

        const data = await response.json();
        debug.log('Raw analysis response:', data);

        // Check for rate limit error
        if (data.answer && data.answer.includes('Error: 429')) {
          debug.warn('Rate limit hit, using fallback analysis');
          const topics = performBasicTopicAnalysis(messagesList);
          setTopicAnalysis(topics);
          return;
        }

        // Process the analysis results
        let topics = [];
        try {
          topics = data.answer
            .split('\n\n')
            .filter(section => section.trim().startsWith('Topic:'))
            .map((section: string) => {
              const lines = section.split('\n');
              const topic: any = {};
              
              lines.forEach(line => {
                const [key, value] = line.split(':').map(s => s.trim());
                if (key === 'Topic') topic.topic = value;
                else if (key === 'Students') topic.count = parseInt(value) || 0;
                else if (key === 'Difficulty') topic.difficulty = value.toLowerCase() as 'easy' | 'medium' | 'hard';
                else if (key === 'Priority') topic.priority = value.toLowerCase() as 'low' | 'medium' | 'high';
                else if (key === 'Description') topic.description = value;
              });

              return {
                topic: topic.topic || 'Unknown Topic',
                count: topic.count || 0,
                difficulty: topic.difficulty || 'medium',
                priority: topic.priority || 'medium',
                description: topic.description || 'No description available'
              };
            })
            .filter(topic => topic.topic !== 'Unknown Topic' && topic.count > 0)
            // Sort by count and priority
            .sort((a, b) => {
              // First sort by count
              if (b.count !== a.count) {
                return b.count - a.count;
              }
              // If counts are equal, sort by priority
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
            })
            // Take only top 5
            .slice(0, 5);
        } catch (parseError) {
          debug.error('Error parsing topics:', parseError);
          // If parsing fails, use fallback analysis
          topics = performBasicTopicAnalysis(messagesList);
        }

        // If no topics were found, use fallback analysis
        if (topics.length === 0) {
          debug.warn('No topics found in response, using fallback analysis');
          topics = performBasicTopicAnalysis(messagesList);
        }

        debug.log('Processed topics:', topics);
        setTopicAnalysis(topics);
      } catch (analysisError) {
        debug.error('Error analyzing topics:', analysisError);
        // Use fallback analysis on error
        const topics = performBasicTopicAnalysis(messagesList);
        setTopicAnalysis(topics);
      }
    } catch (error) {
      debug.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: 'resolved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ doubt_status: status })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      ));
    } catch (error) {
      debug.error('Error updating message status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update message status');
    }
  };

  const analyzeTopics = async (messages: Message[]) => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(d => ({
            role: 'user',
            content: d.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze topics');
      }

      const data = await response.json();
      setTopicAnalysis(data.topics);
    } catch (error) {
      debug.error('Error analyzing topics:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze topics');
    }
  };

  // Fallback function for basic topic analysis
  const performBasicTopicAnalysis = (messages: Message[]): TopicAnalysis[] => {
    const topicMap = new Map<string, { count: number; messages: string[] }>();

    // Group messages by topic keywords
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      let topic = 'General Questions';
      
      // Topic categorization
      if (content.includes('constitution') || content.includes('ಸಂವಿಧಾನ')) {
        topic = 'Constitution and Government';
      } else if (content.includes('algebra') || content.includes('equation') || content.includes('x <')) {
        topic = 'Algebra';
      } else if (content.includes('geometry') || content.includes('shape')) {
        topic = 'Geometry';
      } else if (content.includes('rock') || content.includes('cycle') || content.includes('sediment')) {
        topic = 'Earth Science';
      } else if (content.includes('globalization') || content.includes('privatization')) {
        topic = 'Economics';
      } else if (content.includes('parliament') || content.includes('government') || content.includes('ಸರ್ಕಾರ')) {
        topic = 'Civics';
      } else if (content.includes('history') || content.includes('kingdom') || content.includes('dynasty')) {
        topic = 'History';
      } else if (content.includes('epicenter') || content.includes('earthquake')) {
        topic = 'Natural Disasters';
      } else if (content.includes('fraction') || content.includes('decimal') || content.includes('multiply')) {
        topic = 'Numbers and Operations';
      } else if (content.includes('speed') || content.includes('distance') || content.includes('time')) {
        topic = 'Physics';
      }

      const existing = topicMap.get(topic) || { count: 0, messages: [] };
      topicMap.set(topic, {
        count: existing.count + 1,
        messages: [...existing.messages, msg.content]
      });
    });

    // Convert to TopicAnalysis format and sort
    return Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        difficulty: data.count > 3 ? 'hard' as const : 'medium' as const,
        priority: data.count > 2 ? 'high' as const : 'medium' as const,
        description: `${data.count} students have questions about ${topic.toLowerCase()}. Common questions include: ${data.messages.slice(0, 2).join(', ')}`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Take only top 5
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        <p>Error: {error}</p>
        <Button onClick={fetchMessages} className="mt-4">
          Retry
        </Button>
        {/* Debug Panel */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-2">Debug Information</h3>
          <div className="text-sm font-mono whitespace-pre-wrap">
            {error instanceof Error ? `Message: ${error.message}\nStack: ${error.stack}` : error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Student Messages</h1>
      
      {/* Debug Panel */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-2">Debug Information</h3>
        <div className="text-sm">
          <p>Total Messages: {messages.length}</p>
          <p>Pending: {messages.filter(m => m.status === 'pending').length}</p>
          <p>Resolved: {messages.filter(m => m.status === 'resolved').length}</p>
          <p>Rejected: {messages.filter(m => m.status === 'rejected').length}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending
                  <Badge variant="secondary" className="ml-2">
                    {messages.filter(m => m.status === 'pending').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved
                  <Badge variant="secondary" className="ml-2">
                    {messages.filter(m => m.status === 'resolved').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected
                  <Badge variant="secondary" className="ml-2">
                    {messages.filter(m => m.status === 'rejected').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <div className="space-y-4">
                  {messages
                    .filter(m => m.status === 'pending')
                    .map(message => (
                      <Card key={message.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{message.studentName}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMessageStatus(message.id, 'resolved')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateMessageStatus(message.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="resolved">
                <div className="space-y-4">
                  {messages
                    .filter(m => m.status === 'resolved')
                    .map(message => (
                      <Card key={message.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{message.studentName}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Resolved</Badge>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="rejected">
                <div className="space-y-4">
                  {messages
                    .filter(m => m.status === 'rejected')
                    .map(message => (
                      <Card key={message.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{message.studentName}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="destructive">Rejected</Badge>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Topic Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Topics with Most Doubts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topicAnalysis.map((topic, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{topic.topic}</h3>
                    <Badge variant="secondary">{topic.count} students</Badge>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="outline">Difficulty: {topic.difficulty}</Badge>
                    <Badge variant="outline">Priority: {topic.priority}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{topic.description}</p>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 