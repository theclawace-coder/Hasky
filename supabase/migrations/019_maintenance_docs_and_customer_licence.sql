-- Add drivers licence fields to customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS drivers_licence_number text,
  ADD COLUMN IF NOT EXISTS drivers_licence_image_url text;

-- Create storage buckets for maintenance documents and customer documents
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('maintenance-docs', 'maintenance-docs', true),
  ('customer-docs', 'customer-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to maintenance-docs
CREATE POLICY "Authenticated users can upload maintenance docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'maintenance-docs');

CREATE POLICY "Authenticated users can read maintenance docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'maintenance-docs');

CREATE POLICY "Public read access to maintenance docs"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'maintenance-docs');

-- Allow authenticated users to upload to customer-docs
CREATE POLICY "Authenticated users can upload customer docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-docs');

CREATE POLICY "Authenticated users can read customer docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'customer-docs');

CREATE POLICY "Public read access to customer docs"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'customer-docs');
