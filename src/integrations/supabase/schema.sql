-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'separator')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID,
    is_voice_session BOOLEAN DEFAULT FALSE,
    is_doubt BOOLEAN DEFAULT FALSE,
    doubt_status TEXT CHECK (doubt_status IN ('pending', 'resolved', 'rejected')),
    file_data JSONB
);

-- Create saved_questions table
CREATE TABLE IF NOT EXISTS saved_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_question_messages table for messages in saved questions
CREATE TABLE IF NOT EXISTS saved_question_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    saved_question_id UUID REFERENCES saved_questions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'separator')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_data JSONB
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    grade TEXT NOT NULL,
    subjects TEXT[] NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performance JSONB DEFAULT '{"overall": 0, "subjects": {}}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_student_id ON chat_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_doubt ON chat_messages(is_doubt);

-- Create RLS policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_question_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can view their own chat messages"
    ON chat_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
    ON chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages"
    ON chat_messages FOR DELETE
    USING (auth.uid() = user_id);

-- Add policy for teachers to view their students' messages
CREATE POLICY "Teachers can view their students' messages"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = chat_messages.student_id
            AND students.teacher_id = auth.uid()
        )
    );

-- Saved questions policies
CREATE POLICY "Users can view their own saved questions"
    ON saved_questions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved questions"
    ON saved_questions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved questions"
    ON saved_questions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved questions"
    ON saved_questions FOR DELETE
    USING (auth.uid() = user_id);

-- Saved question messages policies
CREATE POLICY "Users can view messages in their saved questions"
    ON saved_question_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM saved_questions
        WHERE saved_questions.id = saved_question_messages.saved_question_id
        AND saved_questions.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert messages in their saved questions"
    ON saved_question_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM saved_questions
        WHERE saved_questions.id = saved_question_messages.saved_question_id
        AND saved_questions.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete messages in their saved questions"
    ON saved_question_messages FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM saved_questions
        WHERE saved_questions.id = saved_question_messages.saved_question_id
        AND saved_questions.user_id = auth.uid()
    ));

-- Students policies
CREATE POLICY "Teachers can view their own students"
    ON students FOR SELECT
    USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own students"
    ON students FOR INSERT
    WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own students"
    ON students FOR UPDATE
    USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own students"
    ON students FOR DELETE
    USING (auth.uid() = teacher_id); 