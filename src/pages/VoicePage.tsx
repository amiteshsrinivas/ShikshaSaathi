import { Card } from '@/components/ui/card';
import VoiceInput from '@/components/voice/VoiceInput';
import ChatMessage from '@/components/chat/ChatMessage';
import { useChat } from '@/contexts/ChatContext';
import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VoicePage = () => {
  const { voiceSessionMessages, loading, startVoiceSession, endVoiceSession, sendVoiceMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voiceSessionMessages]);

  const handleVoiceInput = async (text: string) => {
    try {
      await sendVoiceMessage(text);
    } catch (error) {
      console.error('Error handling voice input:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-6"
      >
        <div className="flex justify-between items-center bg-gradient-to-r from-edu-blue/10 to-purple-500/10 p-4 rounded-lg">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-edu-blue to-purple-500 bg-clip-text text-transparent">
              Voice Assistant
            </h1>
            <p className="text-muted-foreground mt-1">
              Speak naturally in your preferred language
            </p>
              </div>
          <Button
            variant="outline"
            size="lg"
            onClick={voiceSessionMessages.length > 0 ? endVoiceSession : startVoiceSession}
            className="flex items-center gap-2 hover:bg-edu-blue hover:text-white transition-colors"
          >
            {voiceSessionMessages.length > 0 ? (
              <>
                <MicOff className="w-5 h-5" />
                End Session
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start Session
              </>
            )}
          </Button>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <VoiceInput onVoiceInput={handleVoiceInput} disabled={loading} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-edu-blue" />
            <h2 className="text-xl font-semibold">Conversation History</h2>
          </div>
          
          <Card className="overflow-hidden border-2 border-edu-blue/20 hover:border-edu-blue/40 transition-colors">
            <div className="max-h-[400px] overflow-y-auto p-6 bg-gradient-to-b from-background to-muted/30">
              <AnimatePresence mode="popLayout">
                {voiceSessionMessages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center p-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <Mic className="w-12 h-12 text-edu-blue/50" />
                      <p className="text-lg">
                        {voiceSessionMessages.length === 0 
                          ? "Click 'Start Session' to begin a new voice conversation"
                          : "No conversation history yet. Try asking something!"}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {voiceSessionMessages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ChatMessage message={message} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VoicePage;
