import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with proper error handling
const initSupabase = () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing required Supabase environment variables');
  }

  return createClient(url, key);
};

const supabase = initSupabase();

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

export async function handler(event) {
  console.log('Settings function called with event:', {
    method: event.httpMethod,
    uid: event.queryStringParameters?.uid,
    headers: event.headers
  });

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const uid = event.queryStringParameters?.uid;
  if (!uid) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing uid parameter' })
    };
  }

  try {
    console.log('Fetching settings for uid:', uid);
    console.log('Using Supabase URL:', process.env.VITE_SUPABASE_URL);
    console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role' : 'anon');
    
    const { data, error } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Database error',
          details: error.message,
          code: error.code
        })
      };
    }

    if (!data) {
      console.log('No settings found for uid:', uid);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Settings not found' })
      };
    }

    console.log('Settings found:', data);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in settings function:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
}