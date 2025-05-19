import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mail, Phone, BookOpen, GraduationCap, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Student = Database['public']['Tables']['students']['Row'] & {
  performance?: {
    overall: number;
    subjects: Record<string, number>;
  };
};

const studentFormSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  grade: z.string().min(1, "Grade is required"),
  subjects: z.string().min(1, "At least one subject is required"),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function TeacherStudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      student_id: "",
      name: "",
      email: "",
      phone: "",
      grade: "",
      subjects: "",
    },
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        toast.error('Authentication error. Please try logging in again.');
        return;
      }
      
      if (!user) {
        console.error('No user found');
        toast.error('You must be logged in to view students');
        return;
      }

      console.log('Fetching students for teacher:', user.id);

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to fetch students: ' + error.message);
        return;
      }

      console.log('Fetched students:', data);
      
      // Cast the performance data to match our interface
      const students = (data || []).map(student => ({
        ...student,
        performance: student.performance as { overall: number; subjects: Record<string, number> } || {
          overall: 0,
          subjects: {}
        }
      }));
      
      setStudents(students);
    } catch (error) {
      console.error('Unexpected error fetching students:', error);
      toast.error('An unexpected error occurred while fetching students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (data: StudentFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add a student');
        return;
      }

      // Check if student with same ID or email already exists
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('id')
        .or(`student_id.eq.${data.student_id},email.eq.${data.email}`)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingStudent) {
        toast.error('A student with this ID or email already exists');
        return;
      }

      // Insert the new student
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          student_id: data.student_id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          grade: data.grade,
          subjects: data.subjects.split(',').map(s => s.trim()),
          teacher_id: user.id,
          last_active: new Date().toISOString(),
          performance: {
            overall: 0,
            subjects: {}
          }
        });

      if (insertError) {
        console.error('Error adding student:', insertError);
        toast.error(insertError.message || 'Failed to add student. Please try again.');
        return;
      }

      await fetchStudents();
      setIsAddDialogOpen(false);
      form.reset();
      toast.success('Student added successfully!');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student. Please try again.');
    }
  };

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
        <h1 className="text-3xl font-bold">Student List</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <Button 
            className="bg-edu-blue hover:bg-edu-blue/90"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add New Student
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">{student.name}</h2>
                  <p className="text-sm text-gray-500">Grade {student.grade}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{student.phone}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {student.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{student.performance?.overall || 0}%</span>
                </div>
                <p className="text-sm text-gray-500">
                  Last active: {new Date(student.last_active).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Contact
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter student ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter student name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter grade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mathematics, Science, English" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" className="bg-edu-blue hover:bg-edu-blue/90">
                  Add Student
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 