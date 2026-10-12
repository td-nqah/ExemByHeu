"use client";

import {
  Exam,
  Question,
  Submission,
  SubmissionAnswer,
  Profile,
  ParsedQuestionDraft,
  Category,
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
const KEY_PROFILES = `${STORAGE_PREFIX}profiles`;
const KEY_CATEGORIES = `${STORAGE_PREFIX}categories`;

export const SEED_CATEGORIES: Category[] = [
  {
    id: "cat_cnxh",
    name: "Chủ nghĩa xã hội (CNXH)",
    slug: "cnxh",
    icon: "BookText",
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_ctmthdh",
    name: "Cấu trúc máy tính & Hệ điều hành",
    slug: "ctmthdh",
    icon: "Cpu",
    status: "active",
    created_at: new Date().toISOString(),
  },
];

// Default Seed Profiles
export const SEED_PROFILES: Profile[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    username: "Admin",
    role: "admin",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    username: "User1",
    role: "user",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    username: "User2",
    role: "user",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    username: "User3",
    role: "user",
    created_at: new Date().toISOString(),
  },
];

// Default Seed Exams (Synchronized with 11 real published exams)
export const SEED_EXAMS: Exam[] = [
  {
    id: "ce2b9f0f-73bf-4813-9d8b-00b09e5062a1",
    title: "Đề cương CTMT: Đề 1",
    description: "Đề cương ôn tập môn Cấu trúc máy tính & Hệ điều hành.",
    duration_minutes: 60,
    category_id: "cat_ctmthdh",
    category_slug: "ctmthdh",
    question_count: 40,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-11T13:58:12.166Z",
  },
  {
    id: "99e9f019-b61c-4cdd-b24a-4d38b4d817d0",
    title: "Đề cương CTMT: Đề 2",
    description: "Đề cương ôn tập môn Cấu trúc máy tính & Hệ điều hành.",
    duration_minutes: 60,
    category_id: "cat_ctmthdh",
    category_slug: "ctmthdh",
    question_count: 40,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-11T17:02:17.586Z",
  },
  {
    id: "11e943ad-d35e-4655-91df-1b2fded8600a",
    title: "Đề cương CTMT: Đề 3",
    description: "Đề cương ôn tập môn Cấu trúc máy tính & Hệ điều hành.",
    duration_minutes: 60,
    category_id: "cat_ctmthdh",
    category_slug: "ctmthdh",
    question_count: 40,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-11T17:06:06.334Z",
  },
  {
    id: "dd7f262b-e1ab-4bd9-9470-bf9b04d39914",
    title: "Đề cương CTMT: Đề 4",
    description: "Đề cương ôn tập môn Cấu trúc máy tính & Hệ điều hành.",
    duration_minutes: 60,
    category_id: "cat_ctmthdh",
    category_slug: "ctmthdh",
    question_count: 40,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-11T17:07:05.225Z",
  },
  {
    id: "c710433a-4a91-4c2d-aeaf-120dbef8ddb3",
    title: "Đề cương CTMT: Đề 5",
    description: "Đề cương ôn tập môn Cấu trúc máy tính & Hệ điều hành.",
    duration_minutes: 60,
    category_id: "cat_ctmthdh",
    category_slug: "ctmthdh",
    question_count: 40,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-11T17:08:14.472Z",
  },
  {
    id: "02eaf730-8a1c-445a-8b9b-126a435b5343",
    title: "Đề cương CNXH: Đề 1(K24)",
    description: "Bộ đề trắc nghiệm và câu hỏi ôn tập chuyên sâu môn Chủ nghĩa Xã hội Khoa học.",
    duration_minutes: 60,
    category_id: "cat_cnxh",
    category_slug: "cnxh",
    question_count: 75,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-10T22:42:32.465Z",
  },
  {
    id: "1568ed83-9fbd-4ebe-9695-f66218d96e00",
    title: "Đề mở CNXH: Đề 1",
    description: "Bộ đề trắc nghiệm và câu hỏi ôn tập chuyên sâu môn Chủ nghĩa Xã hội Khoa học.",
    duration_minutes: 60,
    category_id: "cat_cnxh",
    category_slug: "cnxh",
    question_count: 21,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-10T20:08:34.947Z",
  },
  {
    id: "e9f9cf02-a194-467c-8849-869115f128dc",
    title: "Đề mở CNXH: Đề 2",
    description: "Bộ đề trắc nghiệm và câu hỏi ôn tập chuyên sâu môn Chủ nghĩa Xã hội Khoa học.",
    duration_minutes: 60,
    category_id: "cat_cnxh",
    category_slug: "cnxh",
    question_count: 21,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-10T20:42:19.567Z",
  },
  {
    id: "4e881658-00db-4991-8d6f-739d20c3ee8e",
    title: "Đề mở CNXH: Đề 3",
    description: "Bộ đề trắc nghiệm và câu hỏi ôn tập chuyên sâu môn Chủ nghĩa Xã hội Khoa học.",
    duration_minutes: 60,
    category_id: "cat_cnxh",
    category_slug: "cnxh",
    question_count: 21,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-10T20:44:50.100Z",
  },
  {
    id: "5cb8cfd2-3aab-4920-ba68-ad09c4454c73",
    title: "Đề mở CNXH: Đề 4",
    description: "Bộ đề trắc nghiệm và câu hỏi ôn tập chuyên sâu môn Chủ nghĩa Xã hội Khoa học.",
    duration_minutes: 60,
    category_id: "cat_cnxh",
    category_slug: "cnxh",
    question_count: 21,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-10T20:46:29.933Z",
  },
  {
    id: "bd754608-a772-4291-94d9-5072a35cf7be",
    title: "Đề mở CNXH: Đề 5",
    description: "Bộ đề trắc nghiệm và câu hỏi ôn tập chuyên sâu môn Chủ nghĩa Xã hội Khoa học.",
    duration_minutes: 60,
    category_id: "cat_cnxh",
    category_slug: "cnxh",
    question_count: 21,
    question_type: "multiple_choice",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: "2026-10-10T20:47:08.752Z",
  },
];

export const SEED_QUESTIONS: Question[] = [];

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

  // Clean up legacy demo exams from localStorage if stored on client devices
  const legacyDemoIds = new Set([
    "11111111-1111-1111-1111-111111111111",
    "11111111-1111-1111-1111-222222222222",
    "11111111-1111-1111-1111-333333333333",
    "11111111-1111-1111-1111-444444444444",
    "11111111-1111-1111-1111-555555555555",
  ]);
  const storedExams = getLocal<Exam[]>(KEY_EXAMS, []);
  if (storedExams.some((e) => legacyDemoIds.has(e.id))) {
    setLocal(
      KEY_EXAMS,
      storedExams.filter((e) => !legacyDemoIds.has(e.id))
    );
  }

  if (!localStorage.getItem(KEY_EXAMS) || getLocal<Exam[]>(KEY_EXAMS, []).length === 0) {
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
  // Clean up obsolete legacy storage keys to free browser memory
  if (localStorage.getItem(`${STORAGE_PREFIX}user_bookmarks`)) {
    localStorage.removeItem(`${STORAGE_PREFIX}user_bookmarks`);
  }
  if (localStorage.getItem(`${STORAGE_PREFIX}audit_logs`)) {
    localStorage.removeItem(`${STORAGE_PREFIX}audit_logs`);
  }
  if (!localStorage.getItem(KEY_PROFILES)) {
    setLocal(KEY_PROFILES, SEED_PROFILES);
  }
  if (!localStorage.getItem(KEY_CATEGORIES)) {
    setLocal(KEY_CATEGORIES, SEED_CATEGORIES);
  }
}

// 1. AUTHENTICATION HELPERS
export function getCurrentUser(): Profile | null {
  if (typeof window === "undefined") return null;
  const user = getLocal<Profile | null>(KEY_USER, null);
  if (user && user.username) {
    const raw = user.username.trim().replace(/!+$/, "");
    let formatted = raw;
    if (raw.toLowerCase() === "admin") formatted = "Admin";
    else if (raw.toLowerCase() === "user1") formatted = "User1";
    else if (raw.toLowerCase() === "user2") formatted = "User2";
    else if (raw.toLowerCase() === "user3") formatted = "User3";
    else formatted = raw.charAt(0).toUpperCase() + raw.slice(1);
    if (formatted !== user.username) {
      user.username = formatted;
      setLocal(KEY_USER, user);
    }
  }
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
  const inputUsername = username.trim().toLowerCase().replace(/!+$/, "");

  // Chỉ cho phép gõ đúng 'admin' hoặc 'user' (nghiêm cấm gõ 'user1', 'user2', 'user3' hay bất kỳ tên nào khác)
  if (inputUsername !== "admin" && inputUsername !== "user") {
    return null;
  }

  // Tùy theo mật khẩu 1, 2, 3 mà ánh xạ tài khoản 'user' thành User1, User2, User3
  let targetAccount = inputUsername;
  if (inputUsername === "user") {
    if (password === "1") targetAccount = "user1";
    else if (password === "2") targetAccount = "user2";
    else if (password === "3") targetAccount = "user3";
    else return null;
  }

  // 1. Try Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", targetAccount)
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
          if (targetAccount === "admin" && password === "123") {
            isMatch = true;
          } else if (targetAccount === "user1" && password === "1") {
            isMatch = true;
          } else if (targetAccount === "user2" && password === "2") {
            isMatch = true;
          } else if (targetAccount === "user3" && password === "3") {
            isMatch = true;
          } else if (data.password_hash === password) {
            isMatch = true;
          }
        }

        if (isMatch) {
          let formattedUsername = "User1";
          if (targetAccount === "admin") formattedUsername = "Admin";
          else if (targetAccount === "user2") formattedUsername = "User2";
          else if (targetAccount === "user3") formattedUsername = "User3";

          const profile: Profile = {
            id: data.id,
            username: formattedUsername,
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
  const matched = SEED_PROFILES.find((p) => p.username.toLowerCase() === targetAccount);
  if (matched) {
    let isMatch = false;
    if (targetAccount === "admin" && password === "123") {
      isMatch = true;
    } else if (targetAccount === "user1" && password === "1") {
      isMatch = true;
    } else if (targetAccount === "user2" && password === "2") {
      isMatch = true;
    } else if (targetAccount === "user3" && password === "3") {
      isMatch = true;
    }

    if (isMatch) {
      let formattedUsername = "User1";
      if (targetAccount === "admin") formattedUsername = "Admin";
      else if (targetAccount === "user2") formattedUsername = "User2";
      else if (targetAccount === "user3") formattedUsername = "User3";

      const formattedMatched = { ...matched, username: formattedUsername };
      setCurrentUser(formattedMatched);
      return formattedMatched;
    }
  }

  return null;
}

// Helper: unpack metadata & infer missing fields from raw exam record
function parseExamRecord(
  rawExam: any,
  recentSubs?: Pick<Submission, "id" | "total_score" | "mcq_score" | "status" | "submitted_at">[]
): Exam {
  let category_id = rawExam.category_id;
  let category_slug = rawExam.category_slug;
  let question_count = rawExam.question_count || rawExam.questions?.length;
  let question_type = rawExam.question_type;
  let expires_at = rawExam.expires_at;
  let cleanDescription = rawExam.description || "";

  if (cleanDescription.startsWith("<!--meta:")) {
    const endIdx = cleanDescription.indexOf("-->");
    if (endIdx > 0) {
      try {
        const meta = JSON.parse(cleanDescription.slice(9, endIdx));
        category_id = category_id || meta.category_id;
        category_slug = category_slug || meta.category_slug;
        question_count = question_count || meta.question_count;
        question_type = question_type || meta.question_type;
        expires_at = expires_at || meta.expires_at;
        cleanDescription = cleanDescription.slice(endIdx + 3).trim();
      } catch {}
    }
  }

  if (!category_slug) {
    const lower = (rawExam.title || "").toLowerCase();
    if (lower.includes("cnxh") || lower.includes("chủ nghĩa xã hội")) {
      category_slug = "cnxh";
      category_id = category_id || "cat_cnxh";
    }
  }

  if (!question_count) {
    const seedMatch = SEED_EXAMS.find(
      (s) => s.id === rawExam.id || s.title.trim().toLowerCase() === (rawExam.title || "").trim().toLowerCase()
    );
    if (seedMatch) {
      question_count = seedMatch.question_count;
    }
  }

  if (!question_type && rawExam.questions && rawExam.questions.length > 0) {
    const hasMcq = rawExam.questions.some((q: any) => q.type === "multiple_choice");
    const hasEssay = rawExam.questions.some((q: any) => q.type === "essay");
    question_type = hasMcq && hasEssay ? "mixed" : hasEssay ? "essay" : "multiple_choice";
  }

  return {
    ...rawExam,
    description: cleanDescription,
    category_id: category_id || "cat_cnxh",
    category_slug: category_slug || "cnxh",
    question_count: question_count || rawExam.questions?.length || 0,
    question_type: question_type || "multiple_choice",
    expires_at: expires_at || null,
    recent_submissions: recentSubs ?? rawExam.recent_submissions,
  };
}

// In-memory short cache to eliminate redundant requests and instant tab navigation
let examMemoryCache: { key: string; data: Exam[]; expiresAt: number } | null = null;

export function invalidateExamCache() {
  examMemoryCache = null;
}

// 2. EXAM OPERATIONS

/**
 * Sorts exams in ascending order by natural exam number or title (e.g. "Đề 1" -> "Đề 2" -> ... -> "Đề 5").
 */
export function sortExamsAscending<T extends { title: string }>(exams: T[]): T[] {
  return [...exams].sort((a, b) => {
    // If titles have different prefix groups (e.g. "Đề cương CTMT" vs "Đề mở CNXH")
    const baseA = a.title.includes(":") ? a.title.split(":")[0].trim() : "";
    const baseB = b.title.includes(":") ? b.title.split(":")[0].trim() : "";
    if (baseA && baseB && baseA !== baseB) {
      return a.title.localeCompare(b.title, "vi", { numeric: true });
    }

    // Extract numbers from titles (e.g., "Đề 1", "Đề 2") and sort ascending
    const numA = parseInt(a.title.match(/Đề\s*(\d+)/i)?.[1] || a.title.match(/\d+/)?.[0] || "0", 10);
    const numB = parseInt(b.title.match(/Đề\s*(\d+)/i)?.[1] || b.title.match(/\d+/)?.[0] || "0", 10);
    if (numA !== numB) {
      return numA - numB;
    }
    return a.title.localeCompare(b.title, "vi", { numeric: true });
  });
}

export async function getExams(
  onlyPublished = false,
  userId?: string
): Promise<Exam[]> {
  initStore();

  const cacheKey = `${onlyPublished}_${userId || ""}`;
  const now = Date.now();
  if (examMemoryCache && examMemoryCache.key === cacheKey && examMemoryCache.expiresAt > now) {
    return examMemoryCache.data;
  }

  const localSubmissions = getLocal<Submission[]>(
    KEY_SUBMISSIONS,
    SEED_SUBMISSIONS
  );

  let dbExams: Exam[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      // Lightweight fetch: Select exam columns and lightweight questions(id, type) for counts & type
      let query = supabase.from("exams").select("*, questions(id, type)");
      query = query.neq("title", "__SYSTEM_CATEGORIES__");
      if (onlyPublished) {
        query = query.eq("status", "published");
      }
      query = query.order("created_at", { ascending: true });

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
        dbExams = (data as any[]).map((exam) => parseExamRecord(exam, dbSubs));
      }
    } catch {
      // Use local fallback
    }
  }

  if (dbExams.length === 0) {
    try {
      const res = await fetch("/api/exams");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.exams && json.exams.length > 0) {
          dbExams = (json.exams as any[])
            .filter((e: any) => e.title !== "__SYSTEM_CATEGORIES__" && (!onlyPublished || e.status === "published"))
            .map((e: any) => parseExamRecord(e));
        }
      }
    } catch {}
  }

  if (dbExams.length > 0) {
    dbExams = sortExamsAscending(dbExams);
    setLocal(KEY_EXAMS, dbExams);
    const result = onlyPublished ? dbExams.filter((e) => e.status === "published") : dbExams;
    examMemoryCache = {
      key: cacheKey,
      data: result,
      expiresAt: now + 15000,
    };
    return result;
  }

  const localExams = sortExamsAscending(
    getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS).filter(
      (e) => e.title !== "__SYSTEM_CATEGORIES__"
    )
  );
  const fallbackResult = onlyPublished ? localExams.filter((e) => e.status === "published") : localExams;
  examMemoryCache = {
    key: cacheKey,
    data: fallbackResult,
    expiresAt: now + 5000,
  };
  return fallbackResult;
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
        if (data.questions) {
          data.questions.sort((a: Question, b: Question) => a.order_index - b.order_index);
        }
        return parseExamRecord(data);
      }
    } catch {
      // Use local fallback
    }
  }

  try {
    const res = await fetch(`/api/exams?id=${encodeURIComponent(id)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.exams && json.exams.length > 0) {
        const found = json.exams[0];
        if (found.questions) {
          found.questions.sort((a: Question, b: Question) => a.order_index - b.order_index);
        }
        return parseExamRecord(found);
      }
    }
  } catch {}

  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const questions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);
  const exam = exams.find((e) => e.id === id);
  if (!exam) return null;

  const examQuestions = questions
    .filter((q) => q.exam_id === id)
    .sort((a, b) => a.order_index - b.order_index);

  return parseExamRecord({
    ...exam,
    questions: examQuestions,
  });
}

export async function createExam(
  examData: {
    title: string;
    description: string;
    duration_minutes: number;
    status: "draft" | "published";
    category_id?: string;
    category_slug?: string;
    question_count?: number;
    question_type?: "multiple_choice" | "essay" | "mixed";
    expires_at?: string | null;
  },
  questionsDraft: ParsedQuestionDraft[]
): Promise<Exam> {
  initStore();
  const currentUser = getCurrentUser();
  const createdBy = currentUser?.id || "00000000-0000-0000-0000-000000000001";
  const examId = `exam_${Date.now()}`;

  const cleanCategorySlug = examData.category_slug || (examData.title.toLowerCase().includes("cnxh") ? "cnxh" : "cnxh");
  const cleanCategoryId = examData.category_id || "cat_cnxh";

  const newExam: Exam = {
    id: examId,
    title: examData.title.trim(),
    description: examData.description ? examData.description.trim() : "",
    duration_minutes: examData.duration_minutes || 45,
    category_id: cleanCategoryId,
    category_slug: cleanCategorySlug,
    question_count: examData.question_count || questionsDraft.length || 0,
    question_type: examData.question_type || "multiple_choice",
    expires_at: examData.expires_at || null,
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

  // If Supabase configured, attempt insert with fallback to base columns + embedded meta
  if (isSupabaseConfigured && supabase) {
    try {
      const meta = {
        category_id: newExam.category_id,
        category_slug: newExam.category_slug,
        question_count: newExam.question_count,
        question_type: newExam.question_type,
        expires_at: newExam.expires_at,
      };
      const descWithMeta = `<!--meta:${JSON.stringify(meta)}-->\n${newExam.description || ""}`.trim();

      let insertedExam: any = null;
      let examErr: any = null;

      // 1. Attempt full schema insert first
      try {
        const fullRes = await supabase
          .from("exams")
          .insert({
            title: newExam.title,
            description: descWithMeta,
            duration_minutes: newExam.duration_minutes,
            category_id: newExam.category_id,
            category_slug: newExam.category_slug,
            question_count: newExam.question_count,
            question_type: newExam.question_type,
            expires_at: newExam.expires_at,
            created_by: createdBy,
            status: newExam.status,
          })
          .select()
          .single();
        insertedExam = fullRes.data;
        examErr = fullRes.error;
      } catch (err) {
        examErr = err;
      }

      // 2. Fallback to base columns insert if full columns failed (e.g. PGRST204)
      if (examErr || !insertedExam) {
        const baseRes = await supabase
          .from("exams")
          .insert({
            title: newExam.title,
            description: descWithMeta,
            duration_minutes: newExam.duration_minutes,
            created_by: createdBy,
            status: newExam.status,
          })
          .select()
          .single();
        insertedExam = baseRes.data;
        examErr = baseRes.error;
      }

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
  invalidateExamCache();

  return {
    ...newExam,
    questions: newQuestions,
  };
}

export async function assignExamCategory(
  examId: string,
  categoryId: string,
  categorySlug: string,
  status: "published" | "draft" = "published",
  durationMinutes?: number,
  questionCount?: number
): Promise<Exam | null> {
  initStore();
  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const examIdx = exams.findIndex((e) => e.id === examId);

  if (examIdx !== -1) {
    const target = exams[examIdx];
    const meta = {
      category_id: categoryId,
      category_slug: categorySlug,
      question_count: questionCount || target.question_count || target.questions?.length || 40,
      question_type: target.question_type || "multiple_choice",
      expires_at: target.expires_at || null,
    };
    const cleanDesc = (target.description || "").replace(/^<!--meta:[\s\S]*?-->\n?/, "");
    const descWithMeta = `<!--meta:${JSON.stringify(meta)}-->\n${cleanDesc}`.trim();

    const updatedExam: Exam = {
      ...target,
      category_id: categoryId,
      category_slug: categorySlug,
      status,
      description: cleanDesc,
      duration_minutes: durationMinutes ? Number(durationMinutes) : target.duration_minutes,
    };

    exams[examIdx] = updatedExam;
    setLocal(KEY_EXAMS, exams);
    invalidateExamCache();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("exams")
          .update({
            description: descWithMeta,
            status,
            ...(durationMinutes ? { duration_minutes: Number(durationMinutes) } : {}),
          })
          .eq("id", examId);
      } catch (err) {
        console.warn("assignExamCategory Supabase error:", err);
      }
    }

    return updatedExam;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: supaExam } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .maybeSingle();

      if (supaExam) {
        const meta = {
          category_id: categoryId,
          category_slug: categorySlug,
          question_count: questionCount || 40,
          question_type: "multiple_choice",
        };
        const cleanDesc = (supaExam.description || "").replace(/^<!--meta:[\s\S]*?-->\n?/, "");
        const descWithMeta = `<!--meta:${JSON.stringify(meta)}-->\n${cleanDesc}`.trim();

        await supabase
          .from("exams")
          .update({
            description: descWithMeta,
            status,
            ...(durationMinutes ? { duration_minutes: Number(durationMinutes) } : {}),
          })
          .eq("id", examId);

        const newLocal: Exam = {
          id: supaExam.id,
          title: supaExam.title,
          description: cleanDesc,
          duration_minutes: durationMinutes ? Number(durationMinutes) : supaExam.duration_minutes,
          status,
          created_by: supaExam.created_by || "admin_user",
          created_at: supaExam.created_at,
          category_id: categoryId,
          category_slug: categorySlug,
        };
        setLocal(KEY_EXAMS, [newLocal, ...exams]);
        invalidateExamCache();
        return newLocal;
      }
    } catch (err) {
      console.warn("assignExamCategory remote fetch error:", err);
    }
  }

  return null;
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
    invalidateExamCache();
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

  let updated: Exam | null = null;
  let nextStatus: "published" | "draft" = "published";

  if (examIndex !== -1) {
    const current = exams[examIndex];
    nextStatus = current.status === "published" ? "draft" : "published";
    updated = { ...current, status: nextStatus };
    exams[examIndex] = updated;
    setLocal(KEY_EXAMS, exams);
    invalidateExamCache();
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbItem } = await supabase.from("exams").select("*").eq("id", id).single();
      if (dbItem) {
        nextStatus = dbItem.status === "published" ? "draft" : "published";
        const { data: res } = await supabase
          .from("exams")
          .update({ status: nextStatus })
          .eq("id", id)
          .select()
          .single();
        if (res) {
          updated = {
            ...(updated || (res as Exam)),
            status: res.status,
          };
        }
      }
    } catch {}
  }

  invalidateExamCache();
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
  invalidateExamCache();

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("questions").delete().eq("exam_id", id);
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

  // 1. Live Supabase fetch if configured (lightweight: no redundant questions join)
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from("submissions")
        .select(
          "id, exam_id, user_id, status, mcq_score, essay_score, total_score, submitted_at, exam:exams(id, title, duration_minutes, question_count, question_type, category_slug), user:profiles(id, username, full_name, avatar_url)"
        )
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

  // 1. Live Supabase fetch with questions & answers for grading / review
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, exam:exams(*, questions(*)), user:profiles(*), answers:submission_answers(*)")
        .eq("id", id)
        .single();

      if (!error && data) {
        let sortedQuestions = data.exam?.questions || [];
        if (sortedQuestions.length > 0) {
          sortedQuestions.sort((a: Question, b: Question) => a.order_index - b.order_index);
        }
        const enrichedAnswers = (data.answers || []).map((a: any) => ({
          ...a,
          question: sortedQuestions.find((q: Question) => q.id === a.question_id),
        }));

        return {
          id: data.id,
          exam_id: data.exam_id,
          user_id: data.user_id,
          status: data.status,
          mcq_score: Number(data.mcq_score) || 0,
          essay_score: data.essay_score !== null ? Number(data.essay_score) : null,
          total_score: Number(data.total_score) || 0,
          submitted_at: data.submitted_at,
          exam: data.exam ? { ...data.exam, questions: sortedQuestions } : undefined,
          user: data.user,
          answers: enrichedAnswers,
        };
      }
    } catch {}
  }

  // 2. Local fallback
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



export async function getAllProfiles(): Promise<Profile[]> {
  initStore();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, role, created_at")
        .neq("username", "user")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        return data as Profile[];
      }
    } catch {}
  }
  const profiles = getLocal<Profile[]>(KEY_PROFILES, SEED_PROFILES);
  return profiles.filter((p) => p.username !== "user");
}

export async function adminResetUserPassword(
  targetUsername: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUsername, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.error || "Không thể đặt lại mật khẩu",
      };
    }

    // Also update local profiles if present
    initStore();
    const localProfiles = getLocal<Profile[]>(KEY_PROFILES, SEED_PROFILES);
    const updated = localProfiles.map((p) => {
      if (p.username.toLowerCase() === targetUsername.toLowerCase().trim()) {
        return {
          ...p,
          password_hash: newPassword,
        };
      }
      return p;
    });
    setLocal(KEY_PROFILES, updated);

    return {
      success: true,
      message: data.message || `Đã đổi mật khẩu cho ${targetUsername} thành công`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi kết nối máy chủ";
    return { success: false, message: msg };
  }
}

// Helper: Sync categories list to Supabase __SYSTEM_CATEGORIES__ exam record
async function syncCategoriesToSupabase(categoriesList: Category[]) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: existing } = await supabase
      .from("exams")
      .select("id")
      .eq("title", "__SYSTEM_CATEGORIES__")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("exams")
        .update({ description: JSON.stringify(categoriesList) })
        .eq("id", existing.id);
    } else {
      await supabase.from("exams").insert({
        title: "__SYSTEM_CATEGORIES__",
        description: JSON.stringify(categoriesList),
        duration_minutes: 0,
        created_by: "00000000-0000-0000-0000-000000000001",
        status: "draft",
      });
    }
  } catch {}
}

// 9. CATEGORY OPERATIONS (QUẢN LÝ DANH MỤC CON)
export async function getCategories(activeOnly = false): Promise<Category[]> {
  initStore();
  let dbCats: Category[] | null = null;

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try dedicated categories table if it exists
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        dbCats = data as Category[];
      }
    } catch {}

    // 2. Fallback to system categories record in exams table
    if (!dbCats) {
      try {
        const { data: sysRecord } = await supabase
          .from("exams")
          .select("description")
          .eq("title", "__SYSTEM_CATEGORIES__")
          .maybeSingle();

        if (sysRecord && sysRecord.description) {
          const parsed = JSON.parse(sysRecord.description);
          if (Array.isArray(parsed) && parsed.length > 0) {
            dbCats = parsed as Category[];
          }
        }
      } catch {}
    }
  }

  const localCats = getLocal<Category[]>(KEY_CATEGORIES, SEED_CATEGORIES);
  const combined = dbCats ? [...dbCats, ...localCats] : localCats;

  const seenSlugs = new Set<string>();
  const uniqueCats: Category[] = [];

  for (const c of combined) {
    const slug = (c.slug || "").trim().toLowerCase();
    if (slug && !seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      uniqueCats.push(c);
    }
  }

  if (!seenSlugs.has("cnxh")) {
    uniqueCats.unshift(SEED_CATEGORIES[0]);
  }

  setLocal(KEY_CATEGORIES, uniqueCats);

  if (activeOnly) {
    return uniqueCats.filter((c) => c.status === "active");
  }
  return uniqueCats;
}

export async function createCategory(categoryData: {
  name: string;
  slug: string;
  icon?: string;
  status: "active" | "hidden";
}): Promise<Category> {
  initStore();
  const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cleanSlug = categoryData.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

  const newCat: Category = {
    id,
    name: categoryData.name.trim(),
    slug: cleanSlug || `cat-${Date.now()}`,
    icon: categoryData.icon?.trim() || "BookText",
    status: categoryData.status,
    created_at: new Date().toISOString(),
  };

  const categories = await getCategories(false);
  const updated = [...categories.filter((c) => c.slug !== newCat.slug), newCat];
  setLocal(KEY_CATEGORIES, updated);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("categories").insert({
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug,
        icon: newCat.icon,
        status: newCat.status,
        created_at: newCat.created_at,
      });
    } catch {}
    await syncCategoriesToSupabase(updated);
  }

  if (typeof window !== "undefined") window.dispatchEvent(new Event("categories_updated"));
  return newCat;
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category | null> {
  initStore();
  const categories = await getCategories(false);
  const index = categories.findIndex((c) => c.id === id || c.slug === id);
  if (index === -1) return null;

  const updatedItem: Category = {
    ...categories[index],
    ...updates,
    slug: updates.slug
      ? updates.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
      : categories[index].slug,
  };

  categories[index] = updatedItem;
  setLocal(KEY_CATEGORIES, categories);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("categories")
        .update({
          name: updatedItem.name,
          slug: updatedItem.slug,
          icon: updatedItem.icon,
          status: updatedItem.status,
        })
        .eq("id", id);
    } catch {}
    await syncCategoriesToSupabase(categories);
  }

  if (typeof window !== "undefined") window.dispatchEvent(new Event("categories_updated"));
  return updatedItem;
}

export async function deleteCategory(id: string): Promise<boolean> {
  initStore();
  const categories = await getCategories(false);
  const filtered = categories.filter((c) => c.id !== id && c.slug !== id);
  setLocal(KEY_CATEGORIES, filtered);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("categories").delete().eq("id", id);
    } catch {}
    await syncCategoriesToSupabase(filtered);
  }

  if (typeof window !== "undefined") window.dispatchEvent(new Event("categories_updated"));
  return true;
}


