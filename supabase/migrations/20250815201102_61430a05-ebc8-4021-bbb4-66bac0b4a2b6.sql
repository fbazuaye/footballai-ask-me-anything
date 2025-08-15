-- Create storage bucket for search-related files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('search-files', 'search-files', false);

-- Create policies for search files bucket
CREATE POLICY "Users can upload their own search files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'search-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own search files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'search-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own search files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'search-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own search files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'search-files' AND auth.uid()::text = (storage.foldername(name))[1]);