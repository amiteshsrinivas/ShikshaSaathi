import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NextApiRequest, NextApiResponse } from 'next';

// Debug logging utility
const debug = {
  log: (message: string, data?: any) => {
    console.log(`[DEBUG] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  }
};

// Check if API key is available
if (!process.env.GOOGLE_API_KEY) {
  debug.error('GOOGLE_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  debug.log('Received request:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  if (req.method !== 'POST') {
    debug.error('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      debug.error('No prompt provided');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      debug.error('Google API key is not configured');
      return res.status(500).json({ error: 'Google API key is not configured' });
    }

    debug.log('Initializing Gemini model...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    debug.log('Generating content with prompt:', prompt);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    debug.log('Received response from Gemini:', text);

    // Parse the response to extract topics
    const topics = parseGeminiResponse(text);
    debug.log('Parsed topics:', topics);

    return res.status(200).json({ topics });
  } catch (error: any) {
    debug.error('Error in Gemini API handler:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze topics',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

function parseGeminiResponse(text: string) {
  debug.log('Parsing Gemini response:', text);
  
  // Split the response into topic sections
  const topicSections = text.split('\n\n').filter(section => section.trim());
  debug.log('Topic sections:', topicSections);

  const topics = topicSections.map(section => {
    const lines = section.split('\n');
    const topic: any = {};

    lines.forEach(line => {
      if (line.startsWith('Topic:')) {
        topic.name = line.replace('Topic:', '').trim();
      } else if (line.startsWith('Students:')) {
        topic.studentCount = parseInt(line.match(/\d+/)?.[0] || '0');
      } else if (line.startsWith('Difficulty:')) {
        topic.difficulty = line.replace('Difficulty:', '').trim();
      } else if (line.startsWith('Students list:')) {
        topic.students = line.replace('Students list:', '').trim().split(',').map(s => s.trim());
      } else if (line.startsWith('Last discussed:')) {
        topic.lastDiscussed = line.replace('Last discussed:', '').trim();
      } else if (line.startsWith('Status:')) {
        topic.status = line.replace('Status:', '').trim();
      }
    });

    debug.log('Parsed topic:', topic);
    return topic;
  });

  debug.log('Final parsed topics:', topics);
  return topics;
} 