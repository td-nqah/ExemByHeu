-- ============================================================================
-- SQL Migration: Categories and Exams (One-to-Many Relationship)
-- System: ExamByHeu Online Examination Platform
-- ============================================================================

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'BookText',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by slug and status
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_status ON public.categories (status);

-- 2. Alter exams table to add Category Foreign Key and Schedule Fields
ALTER TABLE public.exams 
    ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS category_slug TEXT,
    ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice',
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Index on exams for fast category-based filtering
CREATE INDEX IF NOT EXISTS idx_exams_category_id ON public.exams (category_id);
CREATE INDEX IF NOT EXISTS idx_exams_category_slug ON public.exams (category_slug);

-- 3. Seed initial category: Chủ nghĩa xã hội (CNXH)
INSERT INTO public.categories (id, name, slug, icon, status)
VALUES ('cat_cnxh', 'Chủ nghĩa xã hội (CNXH)', 'cnxh', 'BookText', 'active')
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, status = EXCLUDED.status;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated/anon users to read active categories
CREATE POLICY "Allow public read active categories"
    ON public.categories
    FOR SELECT
    USING (status = 'active');

-- Allow service role full access
CREATE POLICY "Allow service role full category management"
    ON public.categories
    FOR ALL
    USING (true)
    WITH CHECK (true);
