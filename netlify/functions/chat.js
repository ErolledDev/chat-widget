import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

export async function handler(event) {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Check for valid API key
    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing Gemini API key. Please check your environment variables.'
        })
      };
    }

    // Initialize Gemini with API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const { messages, settings } = JSON.parse(event.body);
    
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid messages format. Expected an array.' })
      };
    }

    // Initialize the model with specific configuration
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });

    // Format the conversation history
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.content
    }));

    // Get the last message
    const lastMessage = messages[messages.length - 1].content;

    try {
      // Create dynamic system prompt based on settings
      const businessContext = settings ? `
Business Name: ${settings.businessName}
${settings.salesRepName ? `Sales Representative: ${settings.salesRepName}` : ''}
${settings.businessInfo ? `\nBusiness Information:\n${settings.businessInfo}` : ''}
` : '';

      const systemPrompt = `
${businessContext}

Instructions for responses:
1. Response Format:
   - Keep responses under 100 words
   - Use plain text only
   - Avoid special characters or formatting

2. Sales Approach:
   - Focus on benefits and value
   - Highlight relevant features
   - Include a clear call to action
   - Be direct but not pushy

3. Content Rules:
   - Only reference provided business information
   - Use natural, conversational tone
   - Keep responses brief and concise
   ${settings?.salesRepName ? `\nRespond as ${settings.salesRepName} from ${settings.businessName}` : ''}

User message: ${lastMessage}`;

      // Start a new chat
      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 150,
        },
      });

      // Send the message and get the response
      const result = await chat.sendMessage(systemPrompt);
      const response = await result.response;
      const text = response.text()
        .trim()
        .replace(/[^\x20-\x7E\n]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s{2,}/g, ' ')
        .replace(/([.!?])\s+/g, '$1\n');

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ response: text })
      };
    } catch (modelError) {
      console.error('Gemini API Error:', modelError);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Error communicating with Gemini API',
          details: modelError.message 
        })
      };
    }
  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
}