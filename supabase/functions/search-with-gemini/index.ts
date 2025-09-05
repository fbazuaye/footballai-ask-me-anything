import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Get user from request headers
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }
    
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

    console.log('Starting RAG search with Flowise...');
    
    // Use Flowise RAG endpoint for document-based search
    const flowiseResponse = await fetch('https://srv938896.hstgr.cloud/api/v1/prediction/d4c3b59e-4822-435b-a3c8-3f8da4261208', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: query
      })
    });

    console.log('Flowise response status:', flowiseResponse.status);

    if (!flowiseResponse.ok) {
      const errorText = await flowiseResponse.text();
      console.error('Flowise API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get response from Flowise RAG' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const flowiseData = await flowiseResponse.json();
    console.log('Flowise data received:', !!flowiseData);

    // Extract the answer and sources from Flowise response
    const summary = flowiseData.text || flowiseData.answer || flowiseData.result || 'No answer found';
    
    // Create mock sources since Flowise might not provide structured sources
    // You may need to adjust this based on actual Flowise response structure
    const sources = flowiseData.sourceDocuments || flowiseData.sources || [{
      title: 'Document-based Answer',
      url: '#',
      snippet: 'Answer retrieved from document knowledge base'
    }];

    console.log('RAG response generated, length:', summary?.length);

    const response = {
      summary,
      sources,
      query
    };

    // Generate session ID for anonymous users
    const sessionId = userId ? null : crypto.randomUUID();
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent');

    // Save search history to public database (for all users)
    try {
      const { error: publicInsertError } = await supabase
        .from('public_search_history')
        .insert({
          user_id: userId,
          session_id: sessionId,
          query: query,
          response: summary,
          sources: sources,
          ip_address: ipAddress,
          user_agent: userAgent
        });
      
      if (publicInsertError) {
        console.error('Error saving public search history:', publicInsertError);
      } else {
        console.log('Public search history saved successfully');
      }
    } catch (publicHistoryError) {
      console.error('Failed to save public search history:', publicHistoryError);
      // Don't fail the request if history saving fails
    }

    // Also save to user-specific history if authenticated
    if (userId) {
      try {
        const { error: insertError } = await supabase
          .from('football_search_history')
          .insert({
            user_id: userId,
            question: query,
            response: summary,
            sources: sources
          });
        
        if (insertError) {
          console.error('Error saving user search history:', insertError);
        } else {
          console.log('User search history saved successfully');
        }
      } catch (historyError) {
        console.error('Failed to save user search history:', historyError);
        // Don't fail the request if history saving fails
      }
    }

    console.log('RAG search completed successfully for query:', query);

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