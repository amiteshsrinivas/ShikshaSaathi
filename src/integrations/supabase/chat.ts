import { supabase } from './client';
import { ChatMessage } from '@/lib/types';

export const saveChatMessage = async (message: ChatMessage, isVoiceSession: boolean = false) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: user.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      is_voice_session: isVoiceSession,
      file_data: message.file ? {
        name: message.file.name,
        type: message.file.type,
        size: message.file.size
      } : null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getChatHistory = async (isVoiceSession: boolean = false) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_voice_session', isVoiceSession)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    file: msg.file_data ? {
      name: msg.file_data.name,
      type: msg.file_data.type,
      size: msg.file_data.size
    } : undefined
  }));
};

export const saveQuestion = async (messages: ChatMessage[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Start a transaction
  const { data: savedQuestion, error: questionError } = await supabase
    .from('saved_questions')
    .insert({
      user_id: user.id,
      title: messages[0]?.content?.slice(0, 50) || 'Untitled Question'
    })
    .select()
    .single();

  if (questionError) throw questionError;

  // Save all messages for this question
  const messagePromises = messages.map(message => 
    supabase
      .from('saved_question_messages')
      .insert({
        saved_question_id: savedQuestion.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        file_data: message.file ? {
          name: message.file.name,
          type: message.file.type,
          size: message.file.size
        } : null
      })
  );

  const results = await Promise.all(messagePromises);
  const errors = results.filter(r => r.error);
  if (errors.length > 0) throw errors[0].error;

  return savedQuestion;
};

export const getSavedQuestions = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: questions, error: questionsError } = await supabase
    .from('saved_questions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (questionsError) throw questionsError;

  // Get messages for each question
  const questionsWithMessages = await Promise.all(
    questions.map(async (question) => {
      const { data: messages, error: messagesError } = await supabase
        .from('saved_question_messages')
        .select('*')
        .eq('saved_question_id', question.id)
        .order('timestamp', { ascending: true });

      if (messagesError) throw messagesError;

      return {
        id: question.id,
        title: question.title,
        created_at: question.created_at,
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          file: msg.file_data ? {
            name: msg.file_data.name,
            type: msg.file_data.type,
            size: msg.file_data.size
          } : undefined
        }))
      };
    })
  );

  return questionsWithMessages;
};

export const deleteSavedQuestion = async (questionId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('saved_questions')
    .delete()
    .eq('id', questionId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const getChatHistoryForQuiz = async (limit: number = 50) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_voice_session', false)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Group messages by conversation blocks
  const conversations: ChatMessage[][] = [];
  let currentBlock: ChatMessage[] = [];

  data.reverse().forEach((msg) => {
    if (msg.role === 'separator') {
      if (currentBlock.length > 0) {
        conversations.push([...currentBlock]);
        currentBlock = [];
      }
    } else {
      currentBlock.push({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        file: msg.file_data ? {
          name: msg.file_data.name,
          type: msg.file_data.type,
          size: msg.file_data.size
        } : undefined
      });
    }
  });

  if (currentBlock.length > 0) {
    conversations.push(currentBlock);
  }

  return conversations;
}; 