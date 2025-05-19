import { useEffect, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveQuizScore, getTotalScore } from '@/integrations/supabase/quiz';

export default function QuizPage() {
  const { quizzes, loading, loadQuizzes } = useChat();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  // Load total score on component mount
  useEffect(() => {
    const loadTotalScore = async () => {
      try {
        const score = await getTotalScore();
        setTotalScore(score);
      } catch (error) {
        console.error('Error loading total score:', error);
      }
    };
    loadTotalScore();
  }, []);

  // Reset states when quizzes change
  useEffect(() => {
    if (quizzes) {
      setSelectedAnswers({});
      setShowExplanations({});
      setScore(0);
      setTotalAnswered(0);
    }
  }, [quizzes]);

  const handleGenerateQuiz = async () => {
    setSelectedAnswers({});
    setShowExplanations({});
    setScore(0);
    setTotalAnswered(0);
    await loadQuizzes();
  };

  const handleAnswerSelect = async (questionId: string, answerIndex: number) => {
    // Only allow answering if not already answered
    if (showExplanations[questionId]) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
    setShowExplanations(prev => ({
      ...prev,
      [questionId]: true
    }));

    // Update score and quiz object
    const question = quizzes?.find(q => q.id === questionId);
    if (question) {
      question.selectedAnswer = answerIndex;
      if (answerIndex === question.correctAnswer) {
        setScore(prev => prev + 1);
      }
    }
    setTotalAnswered(prev => prev + 1);

    // If all questions are answered, save the score
    if (quizzes && totalAnswered + 1 === quizzes.length) {
      setIsSaving(true);
      try {
        await saveQuizScore(question!, score + (answerIndex === question?.correctAnswer ? 1 : 0), quizzes.length);
        // Update total score after saving
        const newTotalScore = await getTotalScore();
        setTotalScore(newTotalScore);
      } catch (error) {
        console.error('Error saving quiz score:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const isAnswerCorrect = (questionId: string) => {
    const selectedAnswer = selectedAnswers[questionId];
    const question = quizzes?.find(q => q.id === questionId);
    return selectedAnswer === question?.correctAnswer;
  };

  // Calculate progress
  const progress = quizzes ? (totalAnswered / quizzes.length) * 100 : 0;
  const answeredQuestions = Object.keys(showExplanations).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Score and Progress Section */}
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Quiz Time!
          </h1>
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full"
            >
              <Coins className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-700">{score} / {quizzes?.length || 0}</span>
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full"
            >
              <Coins className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-700">Total: {totalScore}</span>
            </motion.div>
            <Button 
              onClick={handleGenerateQuiz}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate New Quiz
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {quizzes && quizzes.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress: {answeredQuestions} of {quizzes.length} questions</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <motion.div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Generating your quiz...</p>
          </div>
        </div>
      ) : quizzes && quizzes.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {quizzes.map((quiz, index) => {
            const isAnswered = showExplanations[quiz.id];
            const isCorrect = isAnswered && isAnswerCorrect(quiz.id);
            
            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className={`border-2 transition-all duration-500 ${
                    isAnswered
                      ? isCorrect
                        ? 'bg-green-50 border-green-500'
                        : 'bg-red-50 border-red-500'
                      : 'hover:border-purple-200'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold text-gray-800">
                        Question {index + 1}
                      </CardTitle>
                      {isAnswered && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`flex items-center gap-2 ${
                            isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isCorrect ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <XCircle className="h-6 w-6" />
                          )}
                          <span className="font-medium">
                            {isCorrect ? 'Correct!' : 'Incorrect'}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg mb-6 text-gray-700">{quiz.question}</p>
                    <div className="space-y-3">
                      {quiz.options.map((option, optionIndex) => {
                        const isSelected = selectedAnswers[quiz.id] === optionIndex;
                        const isCorrectOption = quiz.correctAnswer === optionIndex;
                        const showResult = showExplanations[quiz.id];

                        return (
                          <motion.button
                            key={optionIndex}
                            onClick={() => handleAnswerSelect(quiz.id, optionIndex)}
                            disabled={showExplanations[quiz.id]}
                            className={`w-full p-4 rounded-lg text-left transition-all duration-300 ${
                              isSelected
                                ? showResult
                                  ? isCorrectOption
                                    ? 'bg-green-100 border-2 border-green-500'
                                    : 'bg-red-100 border-2 border-red-500'
                                  : 'bg-purple-100 border-2 border-purple-500'
                                : showResult && isCorrectOption
                                ? 'bg-green-100 border-2 border-green-500'
                                : 'bg-white border-2 border-gray-200 hover:border-purple-300'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center">
                              {showResult && (
                                <div className="mr-3">
                                  {isSelected && isCorrectOption && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  )}
                                  {isSelected && !isCorrectOption && (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  )}
                                  {!isSelected && isCorrectOption && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  )}
                                </div>
                              )}
                              <span className="text-gray-700">{option}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                    <AnimatePresence>
                      {showExplanations[quiz.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`mt-4 p-4 rounded-lg ${
                            isCorrect ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className={`h-5 w-5 mt-0.5 ${
                              isCorrect ? 'text-green-600' : 'text-red-600'
                            }`} />
                            <div>
                              <p className="font-semibold mb-1">
                                {isCorrect ? 'Great job!' : 'Not quite right.'}
                              </p>
                              <p className="text-gray-700">
                                {quiz.explanation}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            No Quiz Available
          </h2>
          <p className="text-gray-600 mb-6">
            Start a conversation to generate a quiz based on your chat history.
          </p>
          <Button
            onClick={handleGenerateQuiz}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            Generate Quiz
          </Button>
        </motion.div>
      )}
    </div>
  );
}
