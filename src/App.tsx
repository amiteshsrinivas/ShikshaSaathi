import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatProvider } from "@/contexts/ChatContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import TeacherNavbar from "@/components/layout/TeacherNavbar";
import ChatPage from "@/pages/ChatPage";
import VoicePage from "@/pages/VoicePage";
import QuizPage from "@/pages/QuizPage";
import ProgressPage from "@/pages/ProgressPage";
import HistoryPage from "@/pages/HistoryPage";
import SavedQuestionsPage from "@/pages/SavedQuestionsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import TeacherDashboard from "@/pages/TeacherDashboard";
import TeacherStudentList from "@/pages/teacher/TeacherStudentList";
import TeacherDoubtCorner from "@/pages/teacher/TeacherDoubtCorner";
import TeacherClassroomProgress from "@/pages/teacher/TeacherClassroomProgress";
import TeacherStudentChat from "@/pages/teacher/TeacherStudentChat";
import Index from "@/pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <ThemeProvider>
      <ChatProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Navbar>
                        <ChatPage />
                      </Navbar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/voice"
                  element={
                    <ProtectedRoute>
                      <Navbar>
                        <VoicePage />
                      </Navbar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quiz"
                  element={
                    <ProtectedRoute>
                      <Navbar>
                        <QuizPage />
                      </Navbar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/saved"
                  element={
                    <ProtectedRoute>
                      <Navbar>
                        <SavedQuestionsPage />
                      </Navbar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute>
                      <Navbar>
                        <ProgressPage />
                      </Navbar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <Navbar>
                        <HistoryPage />
                      </Navbar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute>
                      <TeacherNavbar>
                        <TeacherDashboard />
                      </TeacherNavbar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/students"
                  element={
                    <ProtectedRoute>
                      <TeacherNavbar>
                        <TeacherStudentList />
                      </TeacherNavbar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/doubts"
                  element={
                    <ProtectedRoute>
                      <TeacherNavbar>
                        <TeacherDoubtCorner />
                      </TeacherNavbar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/classroom"
                  element={
                    <ProtectedRoute>
                      <TeacherNavbar>
                        <TeacherClassroomProgress />
                      </TeacherNavbar>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/chat"
                  element={
                    <ProtectedRoute>
                      <TeacherNavbar>
                        <TeacherStudentChat />
                      </TeacherNavbar>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
          </Router>
        </TooltipProvider>
      </ChatProvider>
    </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
