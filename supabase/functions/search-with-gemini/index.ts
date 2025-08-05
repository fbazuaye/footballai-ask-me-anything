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
    const serpApiKey = Deno.env.get('SERP_API_KEY');
    console.log('Gemini API Key available:', !!geminiApiKey);
    console.log('SERP API Key available:', !!serpApiKey);
    
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

    if (!serpApiKey) {
      console.error('SERP_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'SERP API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Starting SERP API search...');
    
    // First, get real-time data from SERP API
    const serpResponse = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query + ' football soccer')}&api_key=${serpApiKey}&num=5`
    );

    if (!serpResponse.ok) {
      console.error('SERP API error:', serpResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to get search results' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const serpData = await serpResponse.json();
    console.log('SERP data received, results count:', serpData.organic_results?.length || 0);
    
    // Extract search results for Gemini processing
    const searchResults = serpData.organic_results?.slice(0, 5).map((result: any) => ({
      title: result.title,
      snippet: result.snippet,
      link: result.link
    })) || [];

    console.log('Starting Gemini processing...');
    
    // Use Gemini to process the real-time search results
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

Based on these real-time search results:
${searchResults.map(result => `Title: ${result.title}\nSnippet: ${result.snippet}`).join('\n\n')}

Please provide a comprehensive and intelligent analysis that:
- Synthesizes information from the search results
- Provides accurate, up-to-date football information
- Answers the user's question directly
- Includes relevant details about matches, teams, players, or statistics

Format your response as a clear, informative summary.`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
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

    // Use the actual search results as sources
    const sources = searchResults.map(result => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet
    }));

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