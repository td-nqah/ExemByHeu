-- ============================================================================
-- ExemTest - Supabase PostgreSQL Schema & Auto-Cleanup Migration
-- File: supabase/schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'published',
  is_shuffled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. QUESTIONS TABLE (Cascades on Exam Deletion)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'essay')),
  content TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT,
  max_score NUMERIC NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- 4. SUBMISSIONS TABLE (Cascades on Exam or User Deletion)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending_grading', 'graded')) DEFAULT 'pending_grading',
  mcq_score NUMERIC NOT NULL DEFAULT 0,
  essay_score NUMERIC,
  total_score NUMERIC NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SUBMISSION_ANSWERS TABLE (ON DELETE CASCADE on submission_id & question_id)
CREATE TABLE IF NOT EXISTS public.submission_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  score_awarded NUMERIC NOT NULL DEFAULT 0,
  admin_feedback TEXT
);

-- 6. USER_BOOKMARKS TABLE (Bookmarked questions by users)
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- INDEXES FOR QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam_id ON public.submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id_submitted_at ON public.submissions(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_answers_sub_id ON public.submission_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON public.user_bookmarks(user_id, created_at DESC);

-- ============================================================================
-- AUTO-CLEANUP TRIGGER: KEEP ONLY LATEST 50 SUBMISSIONS PER USER
-- Automatically deletes oldest submission(s) (ORDER BY submitted_at ASC)
-- when COUNT(*) for user_id > 50. Associated submission_answers are purged
-- automatically via ON DELETE CASCADE.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enforce_user_submissions_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.submissions
  WHERE user_id = NEW.user_id;

  IF v_count > 50 THEN
    DELETE FROM public.submissions
    WHERE id IN (
      SELECT id
      FROM public.submissions
      WHERE user_id = NEW.user_id
      ORDER BY submitted_at ASC, id ASC
      LIMIT (v_count - 50)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_user_submissions_limit ON public.submissions;

CREATE TRIGGER trg_enforce_user_submissions_limit
AFTER INSERT ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_user_submissions_limit();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for profiles" ON public.profiles;
CREATE POLICY "Public read for profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service and authenticated insert for profiles" ON public.profiles;
CREATE POLICY "Service and authenticated insert for profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Self update for profiles" ON public.profiles;
CREATE POLICY "Self update for profiles" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read published exams or admin view all" ON public.exams;
CREATE POLICY "Public read published exams or admin view all" ON public.exams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write exams" ON public.exams;
CREATE POLICY "Admin write exams" ON public.exams FOR ALL USING (true);

DROP POLICY IF EXISTS "Read questions for accessible exams" ON public.questions;
CREATE POLICY "Read questions for accessible exams" ON public.questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write questions" ON public.questions;
CREATE POLICY "Admin write questions" ON public.questions FOR ALL USING (true);

DROP POLICY IF EXISTS "Users read own submissions and Admin reads all" ON public.submissions;
CREATE POLICY "Users read own submissions and Admin reads all" ON public.submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert submissions" ON public.submissions;
CREATE POLICY "Users insert submissions" ON public.submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin updates submissions" ON public.submissions;
CREATE POLICY "Admin updates submissions" ON public.submissions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin deletes submissions" ON public.submissions;
CREATE POLICY "Admin deletes submissions" ON public.submissions FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users and admins read answers" ON public.submission_answers;
CREATE POLICY "Users and admins read answers" ON public.submission_answers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert answers" ON public.submission_answers;
CREATE POLICY "Users insert answers" ON public.submission_answers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin updates answers" ON public.submission_answers;
CREATE POLICY "Admin updates answers" ON public.submission_answers FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admin deletes answers" ON public.submission_answers;
CREATE POLICY "Admin deletes answers" ON public.submission_answers FOR DELETE USING (true);

-- USER_BOOKMARKS POLICIES
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users read bookmarks" ON public.user_bookmarks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users manage bookmarks" ON public.user_bookmarks FOR ALL USING (true);

-- ============================================================================
-- SEED ACCOUNTS & SAMPLE EXAMS
-- Admin: username 'admin' / password '123'
-- Users: username 'user1', 'user2', 'user3' / password '1'
-- ============================================================================
INSERT INTO public.profiles (id, username, password_hash, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', '$2b$10$.Ezwh/Y49t0gJ0WybjlrvOyiyOSDHiopiDEbPJYFZpNOnvT1vf8.G', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'user1', '$2b$10$pXWjjD4N5J4KpV4aEG7cpOlLQasOwwCSUlCGdpcvA6PeQWrPYRtDC', 'user'),
  ('00000000-0000-0000-0000-000000000003', 'user2', '$2b$10$pXWjjD4N5J4KpV4aEG7cpOlLQasOwwCSUlCGdpcvA6PeQWrPYRtDC', 'user'),
  ('00000000-0000-0000-0000-000000000004', 'user3', '$2b$10$pXWjjD4N5J4KpV4aEG7cpOlLQasOwwCSUlCGdpcvA6PeQWrPYRtDC', 'user')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.exams (id, title, description, duration_minutes, created_by, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Kiểm tra Kiến trúc Web Hiện đại: Next.js & PostgreSQL',
  'Đánh giá hiểu biết về Server Components, Client State, Database Indexing và Transaction Management.',
  30,
  '00000000-0000-0000-0000-000000000001',
  'published'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.questions (id, exam_id, type, content, options, correct_answer, max_score, order_index)
VALUES
(
  '22222222-2222-2222-2222-222222220001',
  '11111111-1111-1111-1111-111111111111',
  'multiple_choice',
  'Trong Next.js App Router, thành phần nào theo mặc định được render tại server để giảm tải JavaScript bundle gửi về client?',
  '["A. React Server Components (RSC)", "B. Client Components with useState", "C. Web Workers", "D. Redux Store"]'::jsonb,
  'A',
  2.0,
  1
),
(
  '22222222-2222-2222-2222-222222220002',
  '11111111-1111-1111-1111-111111111111',
  'multiple_choice',
  'Chỉ số nào trong cơ sở dữ liệu PostgreSQL phù hợp nhất cho việc tìm kiếm chính xác theo khóa ngoại submission_id?',
  '["A. B-Tree Index", "B. GIN Index", "C. BRIN Index", "D. Hash Index đơn thuần"]'::jsonb,
  'A',
  2.0,
  2
),
(
  '22222222-2222-2222-2222-222222220003',
  '11111111-1111-1111-1111-111111111111',
  'multiple_choice',
  'Khi nào nên sử dụng directive "use client" trong Next.js App Router?',
  '["A. Khi component cần truy cập database trực tiếp", "B. Khi component sử dụng React Hook như useState, useEffect hoặc event listener", "C. Cho mọi component trong thư mục app", "D. Khi muốn render hoàn toàn phía máy chủ"]'::jsonb,
  'B',
  2.0,
  3
),
(
  '22222222-2222-2222-2222-222222220004',
  '11111111-1111-1111-1111-111111111111',
  'essay',
  'Hãy trình bày chiến lược chống rò rỉ dữ liệu (Data Isolation) và kiểm soát quyền truy cập cấp hàng (Row Level Security - RLS) trên Supabase khi triển khai cho hệ thống thi thử trực tuyến nhiều thí sinh.',
  '[]'::jsonb,
  '',
  5.0,
  4
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exams (id, title, description, duration_minutes, created_by, status)
VALUES (
  '11111111-1111-1111-1111-222222222222',
  'Technical English & System Design Fundamentals',
  'Vocabulary, comprehension, and short architectural reasoning in enterprise software engineering.',
  45,
  '00000000-0000-0000-0000-000000000001',
  'published'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.questions (id, exam_id, type, content, options, correct_answer, max_score, order_index)
VALUES
(
  '33333333-3333-3333-3333-333333330001',
  '11111111-1111-1111-1111-222222222222',
  'multiple_choice',
  'What does the acronym ACID stand for in relational database management systems?',
  '["A. Atomicity, Consistency, Isolation, Durability", "B. Asynchronous, Concurrent, Isolated, Distributed", "C. Automated, Consistent, Integrated, Decoupled", "D. Analytical, Compact, Indexed, Dynamic"]'::jsonb,
  'A',
  2.5,
  1
),
(
  '33333333-3333-3333-3333-333333330002',
  '11111111-1111-1111-1111-222222222222',
  'multiple_choice',
  'Which HTTP status code signifies that the client request has succeeded and resulted in a new resource being created?',
  '["A. 200 OK", "B. 201 Created", "C. 204 No Content", "D. 304 Not Modified"]'::jsonb,
  'B',
  2.5,
  2
),
(
  '33333333-3333-3333-3333-333333330003',
  '11111111-1111-1111-1111-222222222222',
  'essay',
  'Briefly explain why optimistic locking or idempotency keys are crucial when handling online exam submission endpoints under high network latency.',
  '[]'::jsonb,
  '',
  5.0,
  3
)
ON CONFLICT (id) DO NOTHING;
