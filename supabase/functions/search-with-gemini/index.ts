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

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const cohereApiKey = Deno.env.get('COHERE_API_KEY');
    console.log('OpenAI API Key available:', !!openaiApiKey);
    console.log('Cohere API Key available:', !!cohereApiKey);
    
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!cohereApiKey) {
      console.error('COHERE_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Cohere API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Starting Cohere search...');
    
    // First, get real-time data from Cohere API
    const cohereResponse = await fetch(
      'https://api.cohere.ai/v1/web-search',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query + ' football soccer',
          max_results: 5
        })
      }
    );

    if (!cohereResponse.ok) {
      console.error('Cohere API error:', cohereResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to get search results' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const cohereData = await cohereResponse.json();
    console.log('Cohere data received, results count:', cohereData.search_results?.length || 0);
    
    // Extract search results for OpenAI processing
    const searchResults = cohereData.search_results?.map((result: any) => ({
      title: result.title,
      snippet: result.snippet,
      link: result.url
    })) || [];

    console.log('Starting OpenAI processing...');
    
    // Use OpenAI to process the real-time search results
    const openaiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a football expert. Provide comprehensive and intelligent analysis based on search results.'
            },
            {
              role: 'user',
              content: `The user asked: "${query}"

Based on these real-time search results:
${searchResults.map(result => `Title: ${result.title}\nSnippet: ${result.snippet}`).join('\n\n')}

Please provide a comprehensive and intelligent analysis that:
- Synthesizes information from the search results
- Provides accurate, up-to-date football information
- Answers the user's question directly
- Includes relevant details about matches, teams, players, or statistics

Format your response as a clear, informative summary.`
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      }
    );

    console.log('OpenAI response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get response from OpenAI' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI data received:', !!openaiData.choices);
    
    if (!openaiData.choices || openaiData.choices.length === 0) {
      console.error('No response from OpenAI');
      return new Response(
        JSON.stringify({ error: 'No response from AI' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const summary = openaiData.choices[0].message.content;
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