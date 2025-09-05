-- Create public search history table for all users (authenticated and anonymous)
CREATE TABLE public.public_search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL, -- Optional for authenticated users
  session_id TEXT NULL, -- For tracking anonymous users
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  sources JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET NULL,
  user_agent TEXT NULL
);

-- Enable RLS but allow public access
ALTER TABLE public.public_search_history ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert search queries (authenticated or anonymous)
CREATE POLICY "Anyone can insert search queries" 
ON public.public_search_history 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow users to view their own searches (by user_id or session_id)
CREATE POLICY "Users can view their own searches" 
ON public.public_search_history 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  (auth.uid() IS NULL AND session_id IS NOT NULL)
);

-- Create index for better performance
CREATE INDEX idx_public_search_history_user_id ON public.public_search_history(user_id);
CREATE INDEX idx_public_search_history_session_id ON public.public_search_history(session_id);
CREATE INDEX idx_public_search_history_created_at ON public.public_search_history(created_at DESC);