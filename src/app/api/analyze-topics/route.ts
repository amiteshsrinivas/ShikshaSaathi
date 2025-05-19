import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Prepare the prompt for Gemini
    const prompt = `Analyze the following student chat messages and identify topics that need to be covered by the teacher. 
    For each topic, provide:
    1. Topic name
    2. Frequency of mentions
    3. Difficulty level (high/medium/low)
    4. List of students who discussed this topic
    5. Last discussed date
    6. Status (needs_review/in_progress/covered)

    Messages:
    ${messages.map(msg => `[${msg.timestamp}] Student ${msg.studentName}: ${msg.content}`).join('\n')}

    Format the response as a JSON array of objects with the following structure:
    [
      {
        "topic": "string",
        "frequency": number,
        "difficulty": "high" | "medium" | "low",
        "students": string[],
        "lastDiscussed": "ISO date string",
        "status": "needs_review" | "in_progress" | "covered"
      }
    ]`;

    // Get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const analysis = JSON.parse(text);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing topics:', error);
    return NextResponse.json({ error: 'Failed to analyze topics' }, { status: 500 });
  }
} 