import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Users, Target, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';

interface ClassStats {
  subject: string;
  averageScore: number;
  improvement: number;
  totalStudents: number;
  passingStudents: number;
  topPerformers: number;
  needsHelp: number;
}

interface WeeklyProgress {
  week: string;
  averageScore: number;
  completionRate: number;
  participationRate: number;
}

export default function TeacherClassroomProgress() {
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [selectedClass, setSelectedClass] = useState('10A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    // Mock data for demonstration
    setClassStats([
      {
        subject: 'Mathematics',
        averageScore: 85,
        improvement: 5.2,
        totalStudents: 30,
        passingStudents: 27,
        topPerformers: 8,
        needsHelp: 3
      },
      {
        subject: 'Science',
        averageScore: 82,
        improvement: 3.8,
        totalStudents: 30,
        passingStudents: 25,
        topPerformers: 6,
        needsHelp: 5
      },
      {
        subject: 'English',
        averageScore: 88,
        improvement: 4.5,
        totalStudents: 30,
        passingStudents: 28,
        topPerformers: 10,
        needsHelp: 2
      }
    ]);

    setWeeklyProgress([
      { week: 'Week 1', averageScore: 75, completionRate: 85, participationRate: 90 },
      { week: 'Week 2', averageScore: 78, completionRate: 88, participationRate: 92 },
      { week: 'Week 3', averageScore: 82, completionRate: 90, participationRate: 95 },
      { week: 'Week 4', averageScore: 85, completionRate: 92, participationRate: 93 },
      { week: 'Week 5', averageScore: 88, completionRate: 95, participationRate: 96 }
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Classroom Progress</h1>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10A">Class 10A</SelectItem>
            <SelectItem value="10B">Class 10B</SelectItem>
            <SelectItem value="10C">Class 10C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold">{classStats[0]?.totalStudents || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold">
                {Math.round(classStats.reduce((acc, curr) => acc + curr.averageScore, 0) / classStats.length)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overall Improvement</p>
              <p className="text-2xl font-bold">
                {Math.round(classStats.reduce((acc, curr) => acc + curr.improvement, 0) / classStats.length)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Need Attention</p>
              <p className="text-2xl font-bold">
                {classStats.reduce((acc, curr) => acc + curr.needsHelp, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subject-wise</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Weekly Progress Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Weekly Progress</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="averageScore" stroke="#8884d8" name="Average Score" />
                  <Line type="monotone" dataKey="completionRate" stroke="#82ca9d" name="Completion Rate" />
                  <Line type="monotone" dataKey="participationRate" stroke="#ffc658" name="Participation Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Subject-wise Performance */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Subject-wise Performance</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="averageScore" fill="#8884d8" name="Average Score" />
                  <Bar dataKey="improvement" fill="#82ca9d" name="Improvement" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          {classStats.map((subject) => (
            <Card key={subject.subject} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{subject.subject}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Improvement:</span>
                  <span className={`font-semibold ${subject.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {subject.improvement >= 0 ? <ArrowUp className="h-4 w-4 inline" /> : <ArrowDown className="h-4 w-4 inline" />}
                    {Math.abs(subject.improvement)}%
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Score</span>
                    <span>{subject.averageScore}%</span>
                  </div>
                  <Progress value={subject.averageScore} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Passing Students</p>
                    <p className="text-xl font-semibold">{subject.passingStudents}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Top Performers</p>
                    <p className="text-xl font-semibold">{subject.topPerformers}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Need Help</p>
                    <p className="text-xl font-semibold text-orange-600">{subject.needsHelp}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Trends</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="averageScore" stroke="#8884d8" name="Average Score" />
                  <Line type="monotone" dataKey="completionRate" stroke="#82ca9d" name="Completion Rate" />
                  <Line type="monotone" dataKey="participationRate" stroke="#ffc658" name="Participation Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 