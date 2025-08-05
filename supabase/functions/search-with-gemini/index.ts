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
    console.log('Function invoked with method:', req.method);
    const { query } = await req.json();
    console.log('Query received:', query);
    
    if (!query || query.trim() === '') {
      console.log('Empty query provided');
      return new Response(
        JSON.stringify({ error: 'Query is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    console.log('Gemini API Key available:', !!geminiApiKey);
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Starting Gemini API call...');
    
    // Use Gemini to generate football information
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a football expert. The user asked: "${query}"

Please provide detailed football information for this query. Focus on accurate, factual information about:
- Match results and scores
- Team performance
- Player statistics
- Competition details

Format your response as a comprehensive summary that directly answers the user's question.`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          }
        })
      }
    );

    console.log('Gemini response status:', geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get response from Gemini' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini data received:', !!geminiData.candidates);
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('No response from Gemini');
      return new Response(
        JSON.stringify({ error: 'No response from AI' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const summary = geminiData.candidates[0].content.parts[0].text;
    console.log('Summary generated, length:', summary?.length);

    // Create dummy sources for now
    const sources = [
      {
        title: "Football Information",
        url: "#",
        snippet: "Generated from AI knowledge base"
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
      JSON.stringify({ error: 'Internal server error: ' + error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});