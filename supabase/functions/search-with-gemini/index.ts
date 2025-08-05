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

    const serpApiKey = '78a620ad07c5a759a8db0059b93127f52e6802f8f8d14e34d179e6dee6bb1f04';
    
    if (!serpApiKey) {
      console.error('SERP_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Call SerpAPI for Google search results
    const serpResponse = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query + ' football')}&api_key=${serpApiKey}&num=10`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!serpResponse.ok) {
      const errorText = await serpResponse.text();
      console.error('SerpAPI error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get search results' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const serpData = await serpResponse.json();
    
    if (!serpData.organic_results || serpData.organic_results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No search results found' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract and format the search results
    const sources = serpData.organic_results.slice(0, 5).map((result: any) => ({
      title: result.title || 'No title',
      url: result.link || '#',
      snippet: result.snippet || 'No description available'
    }));

    // Create a summary from the search results
    const summary = `Here are the latest search results for "${query}":\n\n` + 
      sources.map((source, index) => 
        `${index + 1}. ${source.title}\n${source.snippet}`
      ).join('\n\n');


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