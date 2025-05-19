import { supabase } from './client';
import { Quiz } from '@/lib/types';

export interface QuizScore {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  topic: string;
  created_at: string;
}

export const saveQuizScore = async (quiz: Quiz, score: number, totalQuestions: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('quiz_scores')
      .insert([
        {
          user_id: user.id,
          quiz_id: quiz.id,
          score,
          total_questions: totalQuestions,
          topic: quiz.topic || 'General'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving quiz score:', error);
    throw error;
  }
};

export const getQuizScores = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as QuizScore[];
  } catch (error) {
    console.error('Error fetching quiz scores:', error);
    throw error;
  }
};

export const getQuizStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    // Group scores by topic
    const stats = data.reduce((acc: Record<string, { correct: number; total: number }>, score) => {
      const topic = score.topic;
      if (!acc[topic]) {
        acc[topic] = { correct: 0, total: 0 };
      }
      acc[topic].correct += score.score;
      acc[topic].total += score.total_questions;
      return acc;
    }, {});

    // Convert to array format
    return Object.entries(stats).map(([topic, { correct, total }]) => ({
      topic,
      correct,
      total,
      accuracy: (correct / total) * 100
    }));
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    throw error;
  }
};

export const getTotalScore = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('quiz_scores')
      .select('score')
      .eq('user_id', user.id);

    if (error) throw error;

    // Sum up all scores
    const totalScore = data.reduce((sum, record) => sum + record.score, 0);
    return totalScore;
  } catch (error) {
    console.error('Error fetching total score:', error);
    throw error;
  }
}; 