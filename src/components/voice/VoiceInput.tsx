import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Globe, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoiceInputProps {
  onVoiceInput: (text: string) => Promise<void>;
  disabled?: boolean;
}

const languages = [
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'pa-IN', name: 'Punjabi' },
  { code: 'or-IN', name: 'Odia' },
  { code: 'as-IN', name: 'Assamese' },
  { code: 'en-IN', name: 'English (India)' },
];

const VoiceInput = ({ onVoiceInput, disabled = false }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('kn-IN');
  const micButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognitionAPI();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = selectedLanguage;
      
      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(interimTranscript);
        if (finalTranscript) {
          setFinalTranscript(finalTranscript);
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      setIsSupported(false);
      toast.error('Speech recognition is not supported in this browser.');
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [selectedLanguage]);

  const toggleRecording = async () => {
    if (!recognition || disabled) return;

    if (isListening) {
      // Stop recording and send message
      recognition.stop();
      setIsListening(false);
      
      const messageToSend = finalTranscript || transcript;
      if (messageToSend.trim()) {
        try {
          await onVoiceInput(messageToSend);
        setTranscript('');
        setFinalTranscript('');
        } catch (error) {
          console.error('Error sending voice message:', error);
          toast.error('Failed to send message. Please try again.');
        }
      } else {
        toast.error('No speech detected. Please try again.');
      }
    } else {
      // Start recording
      setTranscript('');
      setFinalTranscript('');
      try {
      recognition.start();
      setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error('Failed to start recording. Please try again.');
      }
    }
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <div className="text-destructive mb-2 font-semibold">
            Speech Recognition Not Available
          </div>
          <p className="text-muted-foreground">
            Your browser doesn't support the Speech Recognition API. 
            Please try using Chrome, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className={`transition-all duration-300 ${
        isListening 
          ? 'border-edu-blue shadow-lg shadow-edu-blue/20' 
          : 'border-border hover:border-edu-blue/50'
      }`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-6">
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[180px] bg-background">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-edu-blue" />
                        {lang.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
            <Button
              ref={micButtonRef}
              variant="outline"
              size="lg"
              onClick={toggleRecording}
                disabled={disabled}
                className={`h-20 w-20 rounded-full mb-4 transition-all duration-300 ${
                isListening 
                    ? 'bg-edu-blue text-white shadow-lg shadow-edu-blue/30' 
                  : 'bg-muted hover:bg-edu-blue/10'
              } cursor-pointer select-none`}
            >
                <AnimatePresence mode="wait">
                  {isListening ? (
                    <motion.div
                      key="listening"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="relative"
                    >
                      <MicOff className="h-8 w-8" />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-edu-blue/20"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.2, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="not-listening"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <Mic className="h-8 w-8" />
                    </motion.div>
                  )}
                </AnimatePresence>
            </Button>
            </motion.div>
            
            <div className="text-sm font-medium mb-2 text-center">
              {isListening ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-edu-blue"
                >
                  <Radio className="h-4 w-4 animate-pulse" />
                  Recording... Click again to stop and send
                </motion.div>
              ) : (
                'Click to start recording'
              )}
            </div>
            
            <AnimatePresence mode="wait">
            {(transcript || finalTranscript) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-muted/50 p-4 rounded-md w-full mt-4"
                >
                <p className="text-sm">
                  {finalTranscript || transcript}
                </p>
                </motion.div>
            )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceInput;
