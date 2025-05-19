import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
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
    ${messages.map(msg => `[${msg.timestamp}] Student ${msg.studentId}: ${msg.content}`).join('\n')}

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

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing topics:', error);
    return res.status(500).json({ error: 'Failed to analyze topics' });
  }
} 