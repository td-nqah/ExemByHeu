export type Role = "admin" | "user";

export interface Profile {
  id: string;
  username: string;
  password_hash?: string;
  role: Role;
  is_active?: boolean;
  created_at: string;
}

export interface AccountSecurity {
  username: string;
  role: Role;
  is_active: boolean;
  ips: string[];
  devices: string[];
  updated_at?: string;
}

export type ExamStatus = "draft" | "published";
export type QuestionType = "multiple_choice" | "essay";
export type SubmissionStatus = "pending_grading" | "graded";

export interface Question {
  id: string;
  exam_id: string;
  type: QuestionType;
  content: string;
  options: string[]; // e.g. ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"]
  correct_answer: string; // "A" or "A. Option 1"
  max_score: number;
  order_index: number;
  explanation?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  status: "active" | "hidden";
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  category_id?: string;
  category_slug?: string;
  question_count?: number;
  question_type?: "multiple_choice" | "essay" | "mixed";
  expires_at?: string | null;
  created_by: string;
  status: ExamStatus;
  created_at: string;
  questions?: Question[];
  recent_submissions?: Pick<
    Submission,
    "id" | "total_score" | "mcq_score" | "status" | "submitted_at"
  >[];
}

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean | null;
  score_awarded: number;
  admin_feedback: string | null;
  question?: Question;
}

export interface Submission {
  id: string;
  exam_id: string;
  user_id: string;
  status: SubmissionStatus;
  mcq_score: number;
  essay_score: number | null;
  total_score: number;
  submitted_at: string;
  user?: Profile;
  exam?: Exam;
  answers?: SubmissionAnswer[];
}

export interface ParsedQuestionDraft {
  id: string;
  type: QuestionType;
  content: string;
  options: string[];
  correct_answer: string;
  max_score: number;
}
