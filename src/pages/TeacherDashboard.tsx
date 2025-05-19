import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface QuizStats {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
}

interface StudentProgress {
  id: string;
  name: string;
  overallAccuracy: number;
  quizzesCompleted: number;
  topicsCovered: string[];
  lastActive: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TeacherDashboard() {
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [topicStats, setTopicStats] = useState<QuizStats[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API calls
    // Mock data for demonstration
    setOverallAccuracy(78);
    setTopicStats([
      { topic: 'Algebra', correct: 45, total: 60, accuracy: 75 },
      { topic: 'Geometry', correct: 38, total: 50, accuracy: 76 },
      { topic: 'Calculus', correct: 42, total: 55, accuracy: 76.4 },
      { topic: 'Statistics', correct: 35, total: 45, accuracy: 77.8 },
    ]);
    setStudentProgress([
      {
        id: '1',
        name: 'John Doe',
        overallAccuracy: 85,
        quizzesCompleted: 12,
        topicsCovered: ['Algebra', 'Geometry'],
        lastActive: '2024-03-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Jane Smith',
        overallAccuracy: 92,
        quizzesCompleted: 15,
        topicsCovered: ['Algebra', 'Geometry', 'Calculus'],
        lastActive: '2024-03-15T11:45:00Z'
      },
      // Add more mock students as needed
    ]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Teacher Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold">{studentProgress.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overall Accuracy</p>
              <p className="text-2xl font-bold">{overallAccuracy}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Topics Covered</p>
              <p className="text-2xl font-bold">{topicStats.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Students</p>
              <p className="text-2xl font-bold">
                {studentProgress.filter(s => new Date(s.lastActive) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student Progress</TabsTrigger>
          <TabsTrigger value="topics">Topic Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Topic-wise Accuracy Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Topic-wise Accuracy</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Topic Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Topic Distribution</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topicStats}
                    dataKey="total"
                    nameKey="topic"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label
                  >
                    {topicStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Student Progress</h2>
            <div className="space-y-6">
              {studentProgress.map((student) => (
                <div key={student.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-semibold">{student.name}</h3>
                      <p className="text-sm text-gray-500">
                        Last active: {new Date(student.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{student.overallAccuracy}%</p>
                      <p className="text-sm text-gray-500">Overall Accuracy</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{student.quizzesCompleted} quizzes completed</span>
                    </div>
                    <Progress value={(student.quizzesCompleted / 20) * 100} className="h-2" />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {student.topicsCovered.map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="topics">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Topic Analysis</h2>
            <div className="space-y-6">
              {topicStats.map((topic) => (
                <div key={topic.topic} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">{topic.topic}</h3>
                    <div className="text-right">
                      <p className="font-semibold">{topic.accuracy}%</p>
                      <p className="text-sm text-gray-500">Accuracy</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{topic.correct} / {topic.total} questions</span>
                    </div>
                    <Progress value={(topic.correct / topic.total) * 100} className="h-2" />
                    {topic.accuracy < 70 && (
                      <div className="flex items-center gap-2 text-orange-600 text-sm mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Needs attention - Accuracy below 70%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 