-- Fix security issue: Add user_id column and RLS policies to google_credentials table

-- First, add user_id column to associate credentials with users
ALTER TABLE public.google_credentials 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security on the table
ALTER TABLE public.google_credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to protect Google credentials
CREATE POLICY "Users can only view their own Google credentials" 
ON public.google_credentials 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own Google credentials" 
ON public.google_credentials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own Google credentials" 
ON public.google_credentials 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own Google credentials" 
ON public.google_credentials 
FOR DELETE 
USING (auth.uid() = user_id);