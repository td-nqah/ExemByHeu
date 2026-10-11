"use client";

import {
  Exam,
  Question,
  Submission,
  SubmissionAnswer,
  Profile,
  ParsedQuestionDraft,
  UserBookmark,
} from "@/types/exam";
import { supabase, isSupabaseConfigured } from "./supabase/client";

import bcrypt from "bcryptjs";

// Storage keys
const STORAGE_PREFIX = "exampulse_";
const KEY_USER = `${STORAGE_PREFIX}current_user`;
const KEY_EXAMS = `${STORAGE_PREFIX}exams`;
const KEY_QUESTIONS = `${STORAGE_PREFIX}questions`;
const KEY_SUBMISSIONS = `${STORAGE_PREFIX}submissions`;
const KEY_SUBMISSION_ANSWERS = `${STORAGE_PREFIX}sub_answers`;
const KEY_BOOKMARKS = `${STORAGE_PREFIX}user_bookmarks`;

// Default Seed Profiles
export const SEED_PROFILES: Profile[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    username: "admin",
    role: "admin",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    username: "user1",
    role: "user",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    username: "user2",
    role: "user",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    username: "user3",
    role: "user",
    created_at: new Date().toISOString(),
  },
];

// Default Seed Exams
export const SEED_EXAMS: Exam[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Kiểm tra Kiến trúc Web Hiện đại: Next.js & PostgreSQL",
    description: "Đánh giá hiểu biết chuyên sâu về Server Components, Client State, Database Indexing và Transaction Management.",
    duration_minutes: 30,
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-222222222222",
    title: "Technical English & Enterprise Architecture Fundamentals",
    description: "Vocabulary, architectural reasoning, and fault tolerance strategies in distributed systems.",
    duration_minutes: 45,
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const SEED_QUESTIONS: Question[] = [
  // Exam 1 questions
  {
    id: "22222222-2222-2222-2222-222222220001",
    exam_id: "11111111-1111-1111-1111-111111111111",
    type: "multiple_choice",
    content: "Trong Next.js App Router, thành phần nào theo mặc định được render tại server để giảm tải JavaScript bundle gửi về client?",
    options: [
      "A. React Server Components (RSC)",
      "B. Client Components with useState",
      "C. Web Workers",
      "D. Redux Store",
    ],
    correct_answer: "A",
    max_score: 2.0,
    order_index: 1,
  },
  {
    id: "22222222-2222-2222-2222-222222220002",
    exam_id: "11111111-1111-1111-1111-111111111111",
    type: "multiple_choice",
    content: "Chỉ số (Index) nào trong PostgreSQL phù hợp và tối ưu nhất cho việc tra cứu chính xác theo khóa ngoại submission_id?",
    options: [
      "A. B-Tree Index",
      "B. GIN Index",
      "C. BRIN Index",
      "D. Hash Index đơn thuần",
    ],
    correct_answer: "A",
    max_score: 2.0,
    order_index: 2,
  },
  {
    id: "22222222-2222-2222-2222-222222220003",
    exam_id: "11111111-1111-1111-1111-111111111111",
    type: "multiple_choice",
    content: "Khi nào bắt buộc phải khai báo chỉ thị 'use client' ở đầu tệp tin trong Next.js App Router?",
    options: [
      "A. Khi component cần truy vấn database trực tiếp",
      "B. Khi component sử dụng React Hooks (useState, useEffect) hoặc lắng nghe sự kiện người dùng",
      "C. Bắt buộc cho toàn bộ component trong dự án",
      "D. Khi component chỉ render nội dung tĩnh",
    ],
    correct_answer: "B",
    max_score: 2.0,
    order_index: 3,
  },
  {
    id: "22222222-2222-2222-2222-222222220004",
    exam_id: "11111111-1111-1111-1111-111111111111",
    type: "essay",
    content: "Hãy trình bày chiến lược phân tách dữ liệu an toàn và kiểm soát quyền truy cập cấp hàng (Row Level Security - RLS) trên Supabase khi triển khai cho hệ thống thi cử trực tuyến có hàng ngàn thí sinh.",
    options: [],
    correct_answer: "",
    max_score: 4.0,
    order_index: 4,
  },
  // Exam 2 questions
  {
    id: "33333333-3333-3333-3333-333333330001",
    exam_id: "11111111-1111-1111-1111-222222222222",
    type: "multiple_choice",
    content: "What does the acronym ACID stand for in relational database management systems?",
    options: [
      "A. Atomicity, Consistency, Isolation, Durability",
      "B. Asynchronous, Concurrent, Isolated, Distributed",
      "C. Automated, Consistent, Integrated, Decoupled",
      "D. Analytical, Compact, Indexed, Dynamic",
    ],
    correct_answer: "A",
    max_score: 2.5,
    order_index: 1,
  },
  {
    id: "33333333-3333-3333-3333-333333330002",
    exam_id: "11111111-1111-1111-1111-222222222222",
    type: "multiple_choice",
    content: "Which HTTP status code signifies that the client request has succeeded and resulted in a new resource being created?",
    options: [
      "A. 200 OK",
      "B. 201 Created",
      "C. 204 No Content",
      "D. 304 Not Modified",
    ],
    correct_answer: "B",
    max_score: 2.5,
    order_index: 2,
  },
  {
    id: "33333333-3333-3333-3333-333333330003",
    exam_id: "11111111-1111-1111-1111-222222222222",
    type: "essay",
    content: "Briefly explain why optimistic locking or idempotency keys are crucial when handling online exam submission endpoints under high network latency.",
    options: [],
    correct_answer: "",
    max_score: 5.0,
    order_index: 3,
  },
];

// Initial Seed Submissions for User (Empty by default: user starts with clean history)
export const SEED_SUBMISSIONS: Submission[] = [];

export const SEED_SUBMISSION_ANSWERS: SubmissionAnswer[] = [];

// Helper: Local Storage wrapper
function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Lỗi lưu trữ cục bộ", e);
  }
}

// Ensure database initialization
export function initStore(): void {
  if (typeof window === "undefined") return;

  // Clear legacy submission history flag (reset history per user request)
  const KEY_HISTORY_CLEARED = `${STORAGE_PREFIX}history_cleared_v1`;
  if (!localStorage.getItem(KEY_HISTORY_CLEARED)) {
    setLocal(KEY_SUBMISSIONS, []);
    setLocal(KEY_SUBMISSION_ANSWERS, []);
    localStorage.setItem(KEY_HISTORY_CLEARED, "true");
  }

  if (!localStorage.getItem(KEY_EXAMS)) {
    setLocal(KEY_EXAMS, SEED_EXAMS);
  }
  if (!localStorage.getItem(KEY_QUESTIONS)) {
    setLocal(KEY_QUESTIONS, SEED_QUESTIONS);
  }
  if (!localStorage.getItem(KEY_SUBMISSIONS)) {
    setLocal(KEY_SUBMISSIONS, SEED_SUBMISSIONS);
  }
  if (!localStorage.getItem(KEY_SUBMISSION_ANSWERS)) {
    setLocal(KEY_SUBMISSION_ANSWERS, SEED_SUBMISSION_ANSWERS);
  }
  if (!localStorage.getItem(KEY_BOOKMARKS)) {
    setLocal(KEY_BOOKMARKS, []);
  }
}

// 1. AUTHENTICATION HELPERS
export function getCurrentUser(): Profile | null {
  if (typeof window === "undefined") return null;
  const user = getLocal<Profile | null>(KEY_USER, null);
  return user;
}

export function setCurrentUser(user: Profile | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    setLocal(KEY_USER, user);
    document.cookie = `exampulse_role=${user.role}; path=/; max-age=86400; SameSite=Lax`;
  } else {
    localStorage.removeItem(KEY_USER);
    document.cookie = `exampulse_role=; path=/; max-age=0`;
  }
}

export async function loginUser(username: string, password: string): Promise<Profile | null> {
  const cleanUsername = username.trim().toLowerCase();

  // Explicitly disallow removed legacy account 'user'
  if (cleanUsername === "user") {
    return null;
  }

  // 1. Try Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", cleanUsername)
        .single();

      if (!error && data) {
        let isMatch = false;

        // Bcrypt check
        if (data.password_hash) {
          try {
            isMatch = bcrypt.compareSync(password, data.password_hash);
          } catch {
            isMatch = false;
          }
        }

        // Direct credential check
        if (!isMatch) {
          if (data.username === "admin" && password === "123") {
            isMatch = true;
          } else if (
            (data.username === "user1" ||
              data.username === "user2" ||
              data.username === "user3") &&
            password === "1"
          ) {
            isMatch = true;
          } else if (data.password_hash === password) {
            isMatch = true;
          }
        }

        if (isMatch) {
          const profile: Profile = {
            id: data.id,
            username: data.username,
            role: data.role as "admin" | "user",
            created_at: data.created_at,
          };
          setCurrentUser(profile);
          return profile;
        }
      }
    } catch {
      // Fallback to local store if network or Supabase not populated yet
    }
  }

  // 2. Local fallback
  initStore();
  const matched = SEED_PROFILES.find((p) => p.username === cleanUsername);
  if (matched) {
    let isMatch = false;
    if (matched.username === "admin" && password === "123") {
      isMatch = true;
    } else if (
      (matched.username === "user1" ||
        matched.username === "user2" ||
        matched.username === "user3") &&
      password === "1"
    ) {
      isMatch = true;
    }

    if (isMatch) {
      setCurrentUser(matched);
      return matched;
    }
  }

  return null;
}

// 2. EXAM OPERATIONS
export async function getExams(
  onlyPublished = false,
  userId?: string
): Promise<Exam[]> {
  initStore();

  const localSubmissions = getLocal<Submission[]>(
    KEY_SUBMISSIONS,
    SEED_SUBMISSIONS
  );

  // Helper to attach latest 3 submissions for a given exam & user
  const getTop3ForExam = (
    examId: string,
    dbSubs: Submission[] = []
  ): Pick<
    Submission,
    "id" | "total_score" | "mcq_score" | "status" | "submitted_at"
  >[] => {
    if (!userId) return [];
    const combined = [...dbSubs, ...localSubmissions].filter(
      (s) => s.exam_id === examId && s.user_id === userId
    );
    // Deduplicate by id
    const uniqueMap = new Map<string, Submission>();
    for (const s of combined) {
      if (!uniqueMap.has(s.id)) {
        uniqueMap.set(s.id, s);
      }
    }
    return Array.from(uniqueMap.values())
      .sort(
        (a, b) =>
          new Date(b.submitted_at).getTime() -
          new Date(a.submitted_at).getTime()
      )
      .slice(0, 3)
      .map((s) => ({
        id: s.id,
        total_score: Number(s.total_score) || 0,
        mcq_score: Number(s.mcq_score) || 0,
        status: s.status,
        submitted_at: s.submitted_at,
      }));
  };

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from("exams").select("*, questions(*)");
      if (onlyPublished) {
        query = query.eq("status", "published");
      }
      query = query.order("created_at", { ascending: false });

      const [{ data, error }, subRes] = await Promise.all([
        query,
        userId
          ? supabase
              .from("submissions")
              .select(
                "id, exam_id, user_id, total_score, mcq_score, status, submitted_at"
              )
              .eq("user_id", userId)
              .order("submitted_at", { ascending: false })
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (!error && data && data.length > 0) {
        const dbSubs = (subRes.data || []) as Submission[];
        return (data as Exam[]).map((exam) => ({
          ...exam,
          recent_submissions: getTop3ForExam(exam.id, dbSubs),
        }));
      }
    } catch {
      // Use local fallback
    }
  }

  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const questions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);

  const enriched = exams.map((exam) => ({
    ...exam,
    questions: questions.filter((q) => q.exam_id === exam.id),
    recent_submissions: getTop3ForExam(exam.id),
  }));

  if (onlyPublished) {
    return enriched.filter((e) => e.status === "published");
  }
  return enriched;
}

export async function getExamById(id: string): Promise<Exam | null> {
  initStore();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*, questions(*)")
        .eq("id", id)
        .single();
      if (!error && data) {
        // Sort questions by order_index
        if (data.questions) {
          data.questions.sort((a: Question, b: Question) => a.order_index - b.order_index);
        }
        return data as Exam;
      }
    } catch {
      // Use local fallback
    }
  }

  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const questions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);
  const exam = exams.find((e) => e.id === id);
  if (!exam) return null;

  const examQuestions = questions
    .filter((q) => q.exam_id === id)
    .sort((a, b) => a.order_index - b.order_index);

  return {
    ...exam,
    questions: examQuestions,
  };
}

export async function createExam(
  examData: {
    title: string;
    description: string;
    duration_minutes: number;
    status: "draft" | "published";
  },
  questionsDraft: ParsedQuestionDraft[]
): Promise<Exam> {
  initStore();
  const currentUser = getCurrentUser();
  const createdBy = currentUser?.id || "00000000-0000-0000-0000-000000000001";
  const examId = `exam_${Date.now()}`;

  const newExam: Exam = {
    id: examId,
    title: examData.title.trim(),
    description: examData.description.trim(),
    duration_minutes: examData.duration_minutes || 45,
    created_by: createdBy,
    status: examData.status,
    created_at: new Date().toISOString(),
  };

  const newQuestions: Question[] = questionsDraft.map((d, index) => {
    const cleanScore =
      Math.round((Number(d.max_score) > 0 ? Number(d.max_score) : 1) * 100) / 100;
    return {
      id: `q_${Date.now()}_${index + 1}`,
      exam_id: examId,
      type: d.type,
      content: d.content,
      options: d.options,
      correct_answer: d.correct_answer,
      max_score: cleanScore,
      order_index: index + 1,
    };
  });

  // If Supabase configured, attempt insert with exact allocated max_score per question
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: insertedExam, error: examErr } = await supabase
        .from("exams")
        .insert({
          title: newExam.title,
          description: newExam.description,
          duration_minutes: newExam.duration_minutes,
          created_by: createdBy,
          status: newExam.status,
        })
        .select()
        .single();

      if (!examErr && insertedExam) {
        const dbExamId = insertedExam.id;
        newExam.id = dbExamId;
        const dbQuestions = newQuestions.map((q) => ({
          exam_id: dbExamId,
          type: q.type,
          content: q.content,
          options: q.options,
          correct_answer: q.correct_answer,
          max_score: Number(q.max_score),
          order_index: q.order_index,
        }));
        const { data: insertedQuestions } = await supabase
          .from("questions")
          .insert(dbQuestions)
          .select();

        if (insertedQuestions && insertedQuestions.length > 0) {
          for (let i = 0; i < newQuestions.length; i++) {
            if (insertedQuestions[i]?.id) {
              newQuestions[i].id = insertedQuestions[i].id;
              newQuestions[i].exam_id = dbExamId;
            }
          }
        }
      }
    } catch {
      // Local fallback handled below
    }
  }

  // Update local storage
  const currentExams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const currentQuestions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);

  setLocal(KEY_EXAMS, [newExam, ...currentExams]);
  setLocal(KEY_QUESTIONS, [...currentQuestions, ...newQuestions]);

  return {
    ...newExam,
    questions: newQuestions,
  };
}

export async function updateExam(
  examId: string,
  examData: {
    title: string;
    description: string;
    duration_minutes: number;
    status: "draft" | "published";
  },
  questionsDraft: ParsedQuestionDraft[]
): Promise<Exam | null> {
  initStore();
  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const allQuestions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);

  const examIdx = exams.findIndex((e) => e.id === examId);
  if (examIdx !== -1) {
    exams[examIdx] = {
      ...exams[examIdx],
      title: examData.title.trim(),
      description: examData.description.trim(),
      duration_minutes: Number(examData.duration_minutes) || 45,
      status: examData.status,
    };
    setLocal(KEY_EXAMS, exams);
  }

  const existingLocalIds = new Set(
    allQuestions.filter((q) => q.exam_id === examId).map((q) => q.id)
  );

  const updatedQuestionsList: Question[] = questionsDraft.map((d, index) => {
    const cleanScore =
      Math.round((Number(d.max_score) > 0 ? Number(d.max_score) : 1) * 100) / 100;
    const keepId = d.id && existingLocalIds.has(d.id);
    return {
      id: keepId ? d.id : `q_${Date.now()}_${index + 1}`,
      exam_id: examId,
      type: d.type,
      content: d.content,
      options: d.options,
      correct_answer: d.correct_answer,
      max_score: cleanScore,
      order_index: index + 1,
    };
  });

  // Replace questions for this examId in localStorage
  const otherQuestions = allQuestions.filter((q) => q.exam_id !== examId);
  setLocal(KEY_QUESTIONS, [...otherQuestions, ...updatedQuestionsList]);

  // Sync to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("exams")
        .update({
          title: examData.title.trim(),
          description: examData.description.trim(),
          duration_minutes: Number(examData.duration_minutes) || 45,
          status: examData.status,
        })
        .eq("id", examId);

      const { data: existingDbQuestions } = await supabase
        .from("questions")
        .select("id")
        .eq("exam_id", examId);

      const dbExistingIds = new Set(
        (existingDbQuestions || []).map((q: { id: string }) => q.id)
      );

      // 1. Delete removed questions
      const keptDbIds = new Set(
        questionsDraft.map((q) => q.id).filter((id) => dbExistingIds.has(id))
      );
      const removedDbIds = Array.from(dbExistingIds).filter(
        (id) => !keptDbIds.has(id)
      );
      if (removedDbIds.length > 0) {
        await supabase.from("questions").delete().in("id", removedDbIds);
      }

      // 2. Update existing questions & Insert newly added questions
      for (let i = 0; i < updatedQuestionsList.length; i++) {
        const q = updatedQuestionsList[i];
        const draftId = questionsDraft[i]?.id;

        if (draftId && dbExistingIds.has(draftId)) {
          await supabase
            .from("questions")
            .update({
              type: q.type,
              content: q.content,
              options: q.options,
              correct_answer: q.correct_answer,
              max_score: Number(q.max_score),
              order_index: q.order_index,
            })
            .eq("id", draftId);
        } else {
          await supabase.from("questions").insert({
            exam_id: examId,
            type: q.type,
            content: q.content,
            options: q.options,
            correct_answer: q.correct_answer,
            max_score: Number(q.max_score),
            order_index: q.order_index,
          });
        }
      }
    } catch {
      // Local storage already updated above
    }
  }

  return getExamById(examId);
}

export async function updateExamQuestionsScore(
  examId: string,
  updatedQuestions: Question[],
  publishExam = false
): Promise<Exam | null> {
  initStore();
  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const allQuestions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);

  const examIdx = exams.findIndex((e) => e.id === examId);
  if (examIdx !== -1 && publishExam) {
    exams[examIdx] = { ...exams[examIdx], status: "published" };
    setLocal(KEY_EXAMS, exams);
  }

  const scoreMap = new Map<string, number>();
  for (const uq of updatedQuestions) {
    const cleanScore =
      Math.round((Number(uq.max_score) > 0 ? Number(uq.max_score) : 0.25) * 100) / 100;
    scoreMap.set(uq.id, cleanScore);
  }

  const mergedQuestions = allQuestions.map((q) => {
    if (q.exam_id === examId && scoreMap.has(q.id)) {
      return {
        ...q,
        max_score: scoreMap.get(q.id)!,
      };
    }
    return q;
  });
  setLocal(KEY_QUESTIONS, mergedQuestions);

  if (isSupabaseConfigured && supabase) {
    try {
      if (publishExam) {
        await supabase.from("exams").update({ status: "published" }).eq("id", examId);
      }
      for (const uq of updatedQuestions) {
        const cleanScore = scoreMap.get(uq.id) ?? Number(uq.max_score);
        await supabase
          .from("questions")
          .update({ max_score: cleanScore })
          .eq("id", uq.id);
      }
    } catch {}
  }

  return getExamById(examId);
}

export async function toggleExamStatus(id: string): Promise<Exam | null> {
  initStore();
  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const examIndex = exams.findIndex((e) => e.id === id);
  if (examIndex === -1) return null;

  const current = exams[examIndex];
  const newStatus = current.status === "published" ? "draft" : "published";
  const updated = { ...current, status: newStatus as "draft" | "published" };

  exams[examIndex] = updated;
  setLocal(KEY_EXAMS, exams);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("exams").update({ status: newStatus }).eq("id", id);
    } catch {}
  }

  return updated;
}

export async function deleteExam(id: string): Promise<boolean> {
  initStore();
  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const questions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);
  const submissions = getLocal<Submission[]>(KEY_SUBMISSIONS, SEED_SUBMISSIONS);
  const answers = getLocal<SubmissionAnswer[]>(KEY_SUBMISSION_ANSWERS, SEED_SUBMISSION_ANSWERS);

  const removedSubIds = new Set(
    submissions.filter((s) => s.exam_id === id).map((s) => s.id)
  );
  const removedQuestionIds = new Set(
    questions.filter((q) => q.exam_id === id).map((q) => q.id)
  );

  setLocal(
    KEY_EXAMS,
    exams.filter((e) => e.id !== id)
  );
  setLocal(
    KEY_QUESTIONS,
    questions.filter((q) => q.exam_id !== id)
  );
  setLocal(
    KEY_SUBMISSIONS,
    submissions.filter((s) => s.exam_id !== id)
  );
  setLocal(
    KEY_SUBMISSION_ANSWERS,
    answers.filter(
      (a) => !removedSubIds.has(a.submission_id) && !removedQuestionIds.has(a.question_id)
    )
  );

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("exams").delete().eq("id", id);
    } catch {}
  }

  return true;
}

// 3. SUBMISSIONS & GRADING OPERATIONS
export async function submitExam(
  examId: string,
  userAnswers: Record<string, string>
): Promise<Submission> {
  initStore();
  const currentUser = getCurrentUser();
  const userId = currentUser?.id || "00000000-0000-0000-0000-000000000002";
  const submissionId = `sub_${Date.now()}`;

  const exam = await getExamById(examId);
  if (!exam || !exam.questions) {
    throw new Error("Không tìm thấy dữ liệu đề thi.");
  }

  let mcqScore = 0;
  let hasEssay = false;

  const submissionAnswers: SubmissionAnswer[] = [];

  for (const question of exam.questions) {
    const rawAnswer = (userAnswers[question.id] || "").trim();

    if (question.type === "multiple_choice") {
      // Normalize user answer letter (e.g. "A" from "A. React")
      const userLetter = rawAnswer.replace(/^([A-Z])[\.\:\)].*/i, "$1").trim().toUpperCase();
      const correctLetter = question.correct_answer
        .replace(/^([A-Z])[\.\:\)].*/i, "$1")
        .trim()
        .toUpperCase();

      const isCorrect = userLetter.length > 0 && userLetter === correctLetter;
      // Award exact configured max_score for this MCQ question
      const questionMaxScore =
        Number(question.max_score) > 0 ? Number(question.max_score) : 1;
      const scoreAwarded = isCorrect
        ? Math.round(questionMaxScore * 100) / 100
        : 0;
      mcqScore = Math.round((mcqScore + scoreAwarded) * 100) / 100;

      submissionAnswers.push({
        id: `ans_${Date.now()}_${question.id}`,
        submission_id: submissionId,
        question_id: question.id,
        user_answer: rawAnswer,
        is_correct: isCorrect,
        score_awarded: scoreAwarded,
        admin_feedback: null,
      });
    } else {
      hasEssay = true;
      submissionAnswers.push({
        id: `ans_${Date.now()}_${question.id}`,
        submission_id: submissionId,
        question_id: question.id,
        user_answer: rawAnswer,
        is_correct: null,
        score_awarded: 0,
        admin_feedback: null,
      });
    }
  }

  // If there are no essay questions, submission is immediately graded!
  const status: "pending_grading" | "graded" = hasEssay ? "pending_grading" : "graded";
  const essayScore = hasEssay ? null : 0;
  const totalScore = Math.round(mcqScore * 100) / 100;

  const newSubmission: Submission = {
    id: submissionId,
    exam_id: examId,
    user_id: userId,
    status,
    mcq_score: mcqScore,
    essay_score: essayScore,
    total_score: totalScore,
    submitted_at: new Date().toISOString(),
    exam,
    answers: submissionAnswers,
  };

  // Save to local store & Enforce 50-submission limit per user (Cascading delete oldest)
  const existingSubmissions = getLocal<Submission[]>(KEY_SUBMISSIONS, SEED_SUBMISSIONS);
  const existingAnswers = getLocal<SubmissionAnswer[]>(KEY_SUBMISSION_ANSWERS, SEED_SUBMISSION_ANSWERS);

  const allSubmissions = [newSubmission, ...existingSubmissions];
  const userSubs = allSubmissions
    .filter((s) => s.user_id === userId)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  const purgedSubIds = new Set(userSubs.slice(50).map((s) => s.id));
  const retainedSubmissions = allSubmissions.filter((s) => !purgedSubIds.has(s.id));
  const retainedAnswers = [...existingAnswers, ...submissionAnswers].filter(
    (a) => !purgedSubIds.has(a.submission_id)
  );

  setLocal(KEY_SUBMISSIONS, retainedSubmissions);
  setLocal(KEY_SUBMISSION_ANSWERS, retainedAnswers);

  // Sync to Supabase if available (PostgreSQL trigger trg_enforce_user_submissions_limit handles DB cleanup)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: insertedSub } = await supabase
        .from("submissions")
        .insert({
          exam_id: examId,
          user_id: userId,
          status,
          mcq_score: mcqScore,
          essay_score: essayScore,
          total_score: totalScore,
        })
        .select()
        .single();

      if (insertedSub) {
        const dbAnswers = submissionAnswers.map((a) => ({
          submission_id: insertedSub.id,
          question_id: a.question_id,
          user_answer: a.user_answer,
          is_correct: a.is_correct,
          score_awarded: a.score_awarded,
          admin_feedback: a.admin_feedback,
        }));
        await supabase.from("submission_answers").insert(dbAnswers);
      }
    } catch {}
  }

  return newSubmission;
}

export async function getSubmissions(userId?: string): Promise<Submission[]> {
  initStore();

  // 1. Live Supabase fetch if configured
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from("submissions")
        .select("*, exam:exams(*, questions(*)), user:profiles(*)")
        .order("submitted_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const mapped: Submission[] = data.map((sub: any) => ({
          id: sub.id,
          exam_id: sub.exam_id,
          user_id: sub.user_id,
          status: sub.status,
          mcq_score: Number(sub.mcq_score) || 0,
          essay_score: sub.essay_score !== null ? Number(sub.essay_score) : null,
          total_score: Number(sub.total_score) || 0,
          submitted_at: sub.submitted_at,
          exam: sub.exam,
          user: sub.user,
        }));
        if (!userId) {
          setLocal(KEY_SUBMISSIONS, mapped);
        }
        return mapped.slice(0, 50);
      }
    } catch {}
  }

  // 2. Local fallback
  const submissions = getLocal<Submission[]>(KEY_SUBMISSIONS, SEED_SUBMISSIONS);
  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const questions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);
  const profiles = SEED_PROFILES;

  const enriched = submissions
    .map((sub) => {
      const exam = exams.find((e) => e.id === sub.exam_id);
      const examQuestions = questions.filter((q) => q.exam_id === sub.exam_id);
      const user = profiles.find((p) => p.id === sub.user_id);
      return {
        ...sub,
        exam: exam ? { ...exam, questions: examQuestions } : undefined,
        user,
      };
    })
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  if (userId) {
    return enriched.filter((s) => s.user_id === userId).slice(0, 50);
  }
  return enriched;
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  initStore();
  const submissions = getLocal<Submission[]>(KEY_SUBMISSIONS, SEED_SUBMISSIONS);
  const answers = getLocal<SubmissionAnswer[]>(KEY_SUBMISSION_ANSWERS, SEED_SUBMISSION_ANSWERS);
  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const questions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);

  const sub = submissions.find((s) => s.id === id);
  if (!sub) return null;

  const exam = exams.find((e) => e.id === sub.exam_id);
  const examQuestions = questions.filter((q) => q.exam_id === sub.exam_id);
  const subAnswers = answers.filter((a) => a.submission_id === id);

  const enrichedAnswers = subAnswers.map((a) => ({
    ...a,
    question: examQuestions.find((q) => q.id === a.question_id),
  }));

  const user = SEED_PROFILES.find((p) => p.id === sub.user_id);

  return {
    ...sub,
    exam: exam ? { ...exam, questions: examQuestions } : undefined,
    user,
    answers: enrichedAnswers,
  };
}

export async function finalizeGrading(
  submissionId: string,
  essayGrades: { questionId: string; score: number; feedback: string }[]
): Promise<Submission | null> {
  initStore();
  const submissions = getLocal<Submission[]>(KEY_SUBMISSIONS, SEED_SUBMISSIONS);
  const answers = getLocal<SubmissionAnswer[]>(KEY_SUBMISSION_ANSWERS, SEED_SUBMISSION_ANSWERS);

  const subIndex = submissions.findIndex((s) => s.id === submissionId);
  if (subIndex === -1) return null;

  const sub = submissions[subIndex];
  let calculatedEssayScore = 0;

  // Update submission answers
  const updatedAnswers = answers.map((ans) => {
    if (ans.submission_id === submissionId) {
      const grade = essayGrades.find((g) => g.questionId === ans.question_id);
      if (grade) {
        const cleanGradeScore = Math.round((Number(grade.score) || 0) * 100) / 100;
        calculatedEssayScore =
          Math.round((calculatedEssayScore + cleanGradeScore) * 100) / 100;
        return {
          ...ans,
          score_awarded: cleanGradeScore,
          admin_feedback: grade.feedback.trim() || null,
        };
      }
    }
    return ans;
  });

  const finalTotalScore =
    Math.round((Number(sub.mcq_score) + calculatedEssayScore) * 100) / 100;

  const updatedSubmission: Submission = {
    ...sub,
    status: "graded",
    essay_score: calculatedEssayScore,
    total_score: finalTotalScore,
  };

  submissions[subIndex] = updatedSubmission;

  setLocal(KEY_SUBMISSIONS, submissions);
  setLocal(KEY_SUBMISSION_ANSWERS, updatedAnswers);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("submissions")
        .update({
          status: "graded",
          essay_score: calculatedEssayScore,
          total_score: finalTotalScore,
        })
        .eq("id", submissionId);

      for (const grade of essayGrades) {
        await supabase
          .from("submission_answers")
          .update({
            score_awarded: Math.round((Number(grade.score) || 0) * 100) / 100,
            admin_feedback: grade.feedback,
          })
          .eq("submission_id", submissionId)
          .eq("question_id", grade.questionId);
      }
    } catch {}
  }

  return updatedSubmission;
}

// 8. BOOKMARK FUNCTIONS
export async function getBookmarks(userId?: string): Promise<UserBookmark[]> {
  initStore();
  const currentUserId = userId || getCurrentUser()?.id;
  if (!currentUserId) return [];

  let bookmarks: UserBookmark[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("user_bookmarks")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        bookmarks = data as UserBookmark[];
        const allLocal = getLocal<UserBookmark[]>(KEY_BOOKMARKS, []);
        const otherUsers = allLocal.filter((b) => b.user_id !== currentUserId);
        setLocal(KEY_BOOKMARKS, [...otherUsers, ...bookmarks]);
      } else {
        bookmarks = getLocal<UserBookmark[]>(KEY_BOOKMARKS, []).filter(
          (b) => b.user_id === currentUserId
        );
      }
    } catch {
      bookmarks = getLocal<UserBookmark[]>(KEY_BOOKMARKS, []).filter(
        (b) => b.user_id === currentUserId
      );
    }
  } else {
    bookmarks = getLocal<UserBookmark[]>(KEY_BOOKMARKS, []).filter(
      (b) => b.user_id === currentUserId
    );
  }

  // Enrich bookmarks with questions and exams
  const localQuestions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);
  const localExams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);

  let enrichedQuestions = [...localQuestions];
  let enrichedExams = [...localExams];

  if (isSupabaseConfigured && supabase && bookmarks.length > 0) {
    const missingQuestionIds = bookmarks
      .map((b) => b.question_id)
      .filter((qId) => !enrichedQuestions.some((eq) => eq.id === qId));

    if (missingQuestionIds.length > 0) {
      try {
        const { data: dbQuestions } = await supabase
          .from("questions")
          .select("*")
          .in("id", missingQuestionIds);
        if (dbQuestions) {
          enrichedQuestions.push(...dbQuestions);
        }
      } catch {}
    }

    const missingExamIds = bookmarks
      .map((b) => b.exam_id)
      .filter((eId) => !enrichedExams.some((ee) => ee.id === eId));

    if (missingExamIds.length > 0) {
      try {
        const { data: dbExams } = await supabase
          .from("exams")
          .select("*")
          .in("id", missingExamIds);
        if (dbExams) {
          enrichedExams.push(...dbExams);
        }
      } catch {}
    }
  }

  return bookmarks.map((b) => {
    const q = enrichedQuestions.find((item) => item.id === b.question_id);
    const exam = enrichedExams.find((e) => e.id === b.exam_id);
    return {
      ...b,
      question: q,
      exam,
    };
  });
}

export async function addBookmark(
  userId: string,
  questionId: string,
  examId: string
): Promise<UserBookmark> {
  initStore();
  const bookmarks = getLocal<UserBookmark[]>(KEY_BOOKMARKS, []);
  const existing = bookmarks.find(
    (b) => b.user_id === userId && b.question_id === questionId
  );
  if (existing) return existing;

  const newBookmark: UserBookmark = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    question_id: questionId,
    exam_id: examId,
    created_at: new Date().toISOString(),
  };

  bookmarks.unshift(newBookmark);
  setLocal(KEY_BOOKMARKS, bookmarks);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("user_bookmarks").upsert(
        {
          id: newBookmark.id,
          user_id: userId,
          question_id: questionId,
          exam_id: examId,
          created_at: newBookmark.created_at,
        },
        { onConflict: "user_id,question_id" }
      );
    } catch {}
  }

  return newBookmark;
}

export async function removeBookmark(
  userId: string,
  questionId: string
): Promise<void> {
  initStore();
  const bookmarks = getLocal<UserBookmark[]>(KEY_BOOKMARKS, []);
  const updated = bookmarks.filter(
    (b) => !(b.user_id === userId && b.question_id === questionId)
  );
  setLocal(KEY_BOOKMARKS, updated);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("user_bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("question_id", questionId);
    } catch {}
  }
}

export async function toggleBookmark(
  userId: string,
  questionId: string,
  examId: string
): Promise<boolean> {
  initStore();
  const bookmarks = getLocal<UserBookmark[]>(KEY_BOOKMARKS, []);
  const exists = bookmarks.some(
    (b) => b.user_id === userId && b.question_id === questionId
  );

  if (exists) {
    await removeBookmark(userId, questionId);
    return false;
  } else {
    await addBookmark(userId, questionId, examId);
    return true;
  }
}

export async function getUserBookmarkedQuestionIds(
  userId?: string
): Promise<string[]> {
  initStore();
  const currentUserId = userId || getCurrentUser()?.id;
  if (!currentUserId) return [];

  const bookmarks = await getBookmarks(currentUserId);
  return bookmarks.map((b) => b.question_id);
}
