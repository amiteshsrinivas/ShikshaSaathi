-- Create quiz_scores table
CREATE TABLE IF NOT EXISTS quiz_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    topic TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS quiz_scores_user_id_idx ON quiz_scores(user_id);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS quiz_scores_created_at_idx ON quiz_scores(created_at);

-- Add RLS policies
ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own scores
CREATE POLICY "Users can view their own quiz scores"
    ON quiz_scores
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own scores
CREATE POLICY "Users can insert their own quiz scores"
    ON quiz_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id); 