import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const cohereApiKey = 'sWuFS6CzXK3kZ34zw0brMEsFrBRNIBb6srKMI7zw';
    
    if (!cohereApiKey) {
      console.error('COHERE_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call Cohere API
    const cohereResponse = await fetch(
      'https://api.cohere.ai/v1/generate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          prompt: `You are a factual football information assistant. For the query: "${query}"

IMPORTANT INSTRUCTIONS:
- Only provide factually accurate information that you are confident about
- If you don't have current or accurate information, clearly state "I don't have current information about this"
- Avoid speculation or assumptions
- Be specific with dates, numbers, and sources when possible
- Focus on verifiable facts rather than opinions
- If the information might be outdated, mention this

Please provide a factual response based on your knowledge.`,
          max_tokens: 800,
          temperature: 0.1,
          k: 20,
          p: 0.8,
          stop_sequences: [],
          return_likelihoods: 'NONE'
        })
      }
    );

    if (!cohereResponse.ok) {
      const errorText = await cohereResponse.text();
      console.error('Cohere API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get response from AI' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const cohereData = await cohereResponse.json();
    
    if (!cohereData.generations || cohereData.generations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No response generated' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const summary = cohereData.generations[0].text;

    // Create mock sources for now (you can enhance this later)
    const sources = [
      {
        title: "ESPN Football News",
        url: "https://espn.com",
        snippet: "Latest updates and comprehensive coverage of football matches, transfers, and league standings."
      },
      {
        title: "BBC Sport",
        url: "https://bbc.com/sport",
        snippet: "Breaking news, match reports, and in-depth analysis of football events worldwide."
      },
      {
        title: "Sky Sports",
        url: "https://skysports.com",
        snippet: "In-depth football coverage including live scores, fixtures, and expert analysis."
      }
    ];

    const response = {
      summary,
      sources,
      query
    };

    console.log('Search completed successfully for query:', query);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in search-with-gemini function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});