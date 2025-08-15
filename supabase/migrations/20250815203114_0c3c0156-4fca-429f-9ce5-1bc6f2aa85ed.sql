-- Create football_search_history table for FootballAiEngine
CREATE TABLE public.football_search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.football_search_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for football search history
CREATE POLICY "Users can view their own football search history" 
ON public.football_search_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own football search history" 
ON public.football_search_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own football search history" 
ON public.football_search_history 
FOR DELETE 
USING (auth.uid() = user_id);