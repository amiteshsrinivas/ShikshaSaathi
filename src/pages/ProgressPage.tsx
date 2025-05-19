import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuizScores, getQuizStats, QuizScore } from '@/integrations/supabase/quiz';
import { Loader2, TrendingUp, BarChart2, Target, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface QuizStats {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
}

export default function ProgressPage() {
  const [quizStats, setQuizStats] = useState<QuizStats[]>([]);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stats, scores] = await Promise.all([
          getQuizStats(),
          getQuizScores()
        ]);
        setQuizStats(stats);
        setQuizScores(scores);

        // Calculate overall accuracy
        const totalCorrect = stats.reduce((sum, stat) => sum + stat.correct, 0);
        const totalQuestions = stats.reduce((sum, stat) => sum + stat.total, 0);
        setOverallAccuracy(totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0);
      } catch (error) {
        console.error('Error loading quiz data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Prepare data for cumulative progress
  const cumulativeData = quizScores.map((score, index) => {
    const cumulativeScore = quizScores
      .slice(0, index + 1)
      .reduce((sum, s) => sum + s.score, 0);
    return {
      quizNumber: index + 1,
      score: score.score,
      cumulativeScore,
      date: new Date(score.created_at).toLocaleDateString()
    };
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        Your Learning Progress
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Overall Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {overallAccuracy.toFixed(1)}%
              </div>
              <p className="text-gray-600">Overall Accuracy</p>
            </div>
          </CardContent>
        </Card>

        {/* Topic Distribution Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-purple-600" />
              Topic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Progress Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Individual Quiz Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-purple-600" />
              Individual Quiz Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quizNumber" label={{ value: 'Quiz Number', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8B5CF6" name="Quiz Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Cumulative Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quizNumber" label={{ value: 'Quiz Number', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Cumulative Score', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeScore" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Cumulative Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-purple-600" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quizStats.map((stat) => (
              <div key={stat.topic} className="flex items-center justify-between">
                <span className="font-medium">{stat.topic}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">{stat.accuracy.toFixed(1)}%</span>
                  {stat.accuracy < 70 && (
                    <span className="text-red-600 text-sm">Needs improvement</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 