import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key, gracefully handle if not available in dev
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key-for-dev');

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body);
    
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid messages format. Expected an array.' })
      };
    }

    // Only proceed with API call if we have a valid API key
    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          response: "This is a development response. The actual AI responses will work when deployed to Netlify."
        })
      };
    }

    // Initialize the model with specific configuration
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens: 150, // Limit response length
        temperature: 0.7, // Balance between creativity and consistency
        topP: 0.8, // Focus on more likely responses
        topK: 40 // Limit vocabulary diversity
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
      // Add specific instructions for AI behavior
      const systemPrompt = messages.find(msg => msg.role === 'system')?.content || '';
      const enhancedPrompt = `
${systemPrompt}

Instructions for responses:
1. Response Format:
   - Your response must be in valid JSON format
   - Use the following structure:
     {
       "response": "your actual response here"
     }
   - Keep responses under 100 words
   - Use only plain text in responses
   - Avoid special characters, emojis, or formatting

2. Sales Approach:
   - Focus on benefits and value
   - Highlight relevant features
   - Include a clear call to action
   - Be direct but not pushy

3. Content Rules:
   - Only reference provided business information
   - Use natural, conversational tone
   - Keep total response under 100 words
   - Make responses brief and concise

Remember: Always format your response as JSON with a "response" key.

User message: ${lastMessage}`;

      // Start a new chat
      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 150,
        },
      });

      // Send the message and get the response
      const result = await chat.sendMessage(enhancedPrompt);
      const response = await result.response;
      let text = response.text();

      // Try to parse the response as JSON
      let cleanedResponse;
      try {
        // First, try to parse it directly
        const jsonResponse = JSON.parse(text);
        cleanedResponse = jsonResponse.response;
      } catch (e) {
        // If parsing fails, clean the text and create our own JSON response
        cleanedResponse = text
          .trim()
          .replace(/[^\x20-\x7E\n]/g, '') // Remove special characters
          .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
          .replace(/\s{2,}/g, ' ') // Remove excessive spaces
          .replace(/([.!?])\s+/g, '$1\n'); // Add line breaks after sentences
      }

      // Ensure the response is clean and properly formatted
      cleanedResponse = cleanedResponse
        .replace(/[^\x20-\x7E\n]/g, '')
        .trim();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: cleanedResponse })
      };
    } catch (modelError) {
      console.error('Gemini API Error:', modelError);
      return {
        statusCode: 500,
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
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
}