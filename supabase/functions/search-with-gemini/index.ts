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

    const serpApiKey = Deno.env.get('SERP_API_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!serpApiKey) {
      console.error('SERP_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'SerpAPI key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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

    // Prepare search results for Gemini processing
    const searchContext = sources.map((source, index) => 
      `${index + 1}. ${source.title}\n${source.snippet}\nSource: ${source.url}`
    ).join('\n\n');

    // Use Gemini to process and intelligently format the search results
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
              text: `You are an intelligent football information assistant. A user asked: "${query}"

Here are the search results from SerpAPI:
${searchContext}

Please analyze these search results and provide:
1. A comprehensive, well-structured summary that directly answers the user's question
2. Extract the most relevant and accurate information
3. Organize the information logically (chronological, by importance, etc.)
4. Include specific details like dates, scores, statistics when available
5. If the query is about recent events, highlight the most current information
6. Make connections between different pieces of information when relevant

Important guidelines:
- Be factual and accurate based on the search results provided
- Structure your response clearly with proper formatting
- If information conflicts between sources, mention this
- Focus on what's most relevant to the user's specific question
- Keep the tone professional but engaging
- If search results don't fully answer the question, acknowledge this

Provide a clear, informative response that goes beyond just listing the search results.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      // Fallback to basic summary if Gemini fails
      const summary = `Here are the latest search results for "${query}":\n\n` + 
        sources.map((source, index) => 
          `${index + 1}. ${source.title}\n${source.snippet}`
        ).join('\n\n');
      
      const response = {
        summary,
        sources,
        query
      };
      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('No response from Gemini');
      // Fallback to basic summary
      const summary = `Here are the latest search results for "${query}":\n\n` + 
        sources.map((source, index) => 
          `${index + 1}. ${source.title}\n${source.snippet}`
        ).join('\n\n');
      
      const response = {
        summary,
        sources,
        query
      };
      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const summary = geminiData.candidates[0].content.parts[0].text;

    const response = {
      summary,
      sources,
      query
    };

    console.log('Search and AI processing completed successfully for query:', query);

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