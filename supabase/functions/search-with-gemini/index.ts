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
    const serperApiKey = Deno.env.get('SERP_API_KEY');
    
    console.log('OpenAI API Key available:', !!openaiApiKey);
    console.log('Serper API Key available:', !!serperApiKey);
    
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

    if (!serperApiKey) {
      console.error('SERP_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Serper API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Starting web search with Serper...');
    
    // Use Serper API for web search
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 5
      })
    });

    console.log('Serper response status:', serperResponse.status);

    if (!serperResponse.ok) {
      const errorText = await serperResponse.text();
      console.error('Serper API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get search results from Serper' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const serperData = await serperResponse.json();
    console.log('Serper data received:', !!serperData.organic);

    // Extract search results for OpenAI processing
    const searchResults = serperData.organic || [];
    const sources = searchResults.map((result: any) => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet
    }));

    // Prepare content for OpenAI analysis
    const searchContext = searchResults
      .map((result: any) => `Title: ${result.title}\nURL: ${result.link}\nSnippet: ${result.snippet}`)
      .join('\n\n');

    console.log('Starting OpenAI processing with search context...');
    
    // Use OpenAI to analyze search results and provide intelligent response
    const openaiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'You are a knowledgeable AI assistant. Analyze the provided search results and create a comprehensive, well-structured response to the user\'s query. Use the search results as your primary source of information, but also add your own insights and analysis. Be informative, accurate, and cite relevant sources when appropriate.'
            },
            {
              role: 'user',
              content: `Query: ${query}\n\nSearch Results:\n${searchContext}\n\nPlease provide a comprehensive answer based on these search results.`
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