"use client";

import {
  Exam,
  Question,
  Submission,
  SubmissionAnswer,
  Profile,
  ParsedQuestionDraft,
  Category,
  StudyMaterial,
} from "@/types/exam";
import { supabase, isSupabaseConfigured } from "./supabase/client";

// Storage keys
const STORAGE_PREFIX = "exampulse_";
const KEY_USER = `${STORAGE_PREFIX}current_user`;
const KEY_EXAMS = `${STORAGE_PREFIX}exams`;
const KEY_QUESTIONS = `${STORAGE_PREFIX}questions`;
const KEY_SUBMISSIONS = `${STORAGE_PREFIX}submissions`;
const KEY_SUBMISSION_ANSWERS = `${STORAGE_PREFIX}sub_answers`;
const KEY_PROFILES = `${STORAGE_PREFIX}profiles`;
const KEY_CATEGORIES = `${STORAGE_PREFIX}categories`;
const KEY_STUDY_MATERIALS = `${STORAGE_PREFIX}study_materials`;
const KEY_SHUFFLE_CONFIG = `${STORAGE_PREFIX}shuffle_config`;

export interface ShuffleConfig {
  is_global_shuffle: boolean;
  shuffle_map: Record<string, boolean>; // examId -> is_shuffled
  updated_at: string;
}

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

// Default Seed Profiles (4 accounts: adm/5555, tth/1, tmh/2, user/3)
export const SEED_PROFILES: Profile[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    username: "adm",
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    username: "tth",
    role: "user",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    username: "tmh",
    role: "user",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    username: "user",
    role: "user",
    is_active: true,
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
  if (!localStorage.getItem(KEY_STUDY_MATERIALS) || getLocal<StudyMaterial[]>(KEY_STUDY_MATERIALS, []).length === 0) {
    setLocal(KEY_STUDY_MATERIALS, SEED_STUDY_MATERIALS);
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

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server_device";
  let deviceId = localStorage.getItem("exampulse_device_id");
  if (!deviceId) {
    deviceId = "dev_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("exampulse_device_id", deviceId);
  }
  return deviceId;
}

export async function loginUser(username: string, password: string): Promise<Profile | null> {
  const cleanUsername = username.trim().toLowerCase().replace(/!+$/, "");
  const targetAccount = cleanUsername === "admin" ? "adm" : cleanUsername;

  // Chỉ chấp nhận 4 tài khoản hợp lệ: adm, tth, tmh, user
  if (!["adm", "tth", "tmh", "user"].includes(targetAccount)) {
    return null;
  }

  const deviceId = getOrCreateDeviceId();

  // 1. Authenticate via Server API (tracks real IP, unique devices, active status & limit 3)
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: targetAccount,
        password,
        deviceId,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      const profile: Profile = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
        is_active: data.user.is_active,
        created_at: data.user.created_at,
      };
      setCurrentUser(profile);
      return profile;
    }

    if (!res.ok && data.error) {
      throw new Error(data.error);
    }
  } catch (err: unknown) {
    // If it's a specific auth/inactive/limit error thrown by API, rethrow so UI can display it
    if (err instanceof Error && !err.message.includes("fetch")) {
      throw err;
    }
  }

  // 2. Offline / Local fallback check
  initStore();
  let isMatch = false;
  if (targetAccount === "adm" && password === "5555") isMatch = true;
  else if (targetAccount === "tth" && password === "1") isMatch = true;
  else if (targetAccount === "tmh" && password === "2") isMatch = true;
  else if (targetAccount === "user" && password === "3") isMatch = true;

  if (isMatch) {
    const matched = SEED_PROFILES.find((p) => p.username.toLowerCase() === targetAccount);
    if (matched) {
      setCurrentUser(matched);
      return matched;
    }
  }

  return null;
}

// Helper: Question option with ID structure
export interface QuestionOptionWithId {
  id: string; // unique option_id e.g. `${question_id}_opt_${index}`
  index: number;
  original_letter: string; // A, B, C, D
  raw_text: string;
  clean_text: string;
  is_correct: boolean;
}

/**
 * Normalizes question options into structured items with unique IDs
 * and identifies the correct option ID based on question.correct_answer.
 */
export function getQuestionOptionsWithIds(question: Question): QuestionOptionWithId[] {
  const options = Array.isArray(question.options) ? question.options : [];
  const correctLetter = (question.correct_answer || "")
    .replace(/^([A-Z])[\.\:\)].*/i, "$1")
    .trim()
    .toUpperCase();
  const cleanCorrect = (question.correct_answer || "").trim().toLowerCase();

  return options.map((optText, idx) => {
    const letterMatch = optText.match(/^([A-Z])[\.\:\)]/i);
    const originalLetter = letterMatch
      ? letterMatch[1].toUpperCase()
      : String.fromCharCode(65 + idx);
    const cleanText = optText.replace(/^[A-Z][\.\:\)]\s*/i, "").trim();
    const id = `${question.id}_opt_${idx}`;

    const isCorrect =
      (correctLetter.length > 0 && originalLetter === correctLetter) ||
      (cleanCorrect.length > 0 &&
        (optText.trim().toLowerCase() === cleanCorrect ||
          cleanText.toLowerCase() === cleanCorrect));

    return {
      id,
      index: idx,
      original_letter: originalLetter,
      raw_text: optText,
      clean_text: cleanText || optText,
      is_correct: isCorrect,
    };
  });
}

/**
 * Standard Fisher-Yates (Knuth) Shuffle algorithm (unbiased O(N))
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const DEFAULT_SHUFFLE_CONFIG: ShuffleConfig = {
  is_global_shuffle: false,
  shuffle_map: {},
  updated_at: new Date().toISOString(),
};

export async function getShuffleConfig(): Promise<ShuffleConfig> {
  initStore();
  let config = getLocal<ShuffleConfig>(KEY_SHUFFLE_CONFIG, DEFAULT_SHUFFLE_CONFIG);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("description")
        .eq("title", "__SYSTEM_SHUFFLE_CONFIG__")
        .maybeSingle();

      if (!error && data && data.description) {
        const remote = JSON.parse(data.description);
        if (remote && typeof remote === "object") {
          config = {
            ...config,
            ...remote,
            shuffle_map: { ...(config.shuffle_map || {}), ...(remote.shuffle_map || {}) },
          };
          setLocal(KEY_SHUFFLE_CONFIG, config);
        }
      }
    } catch {}
  }

  return config;
}

export async function saveShuffleConfig(newConfig: Partial<ShuffleConfig>): Promise<ShuffleConfig> {
  initStore();
  const current = await getShuffleConfig();
  const merged: ShuffleConfig = {
    is_global_shuffle:
      newConfig.is_global_shuffle !== undefined
        ? Boolean(newConfig.is_global_shuffle)
        : current.is_global_shuffle,
    shuffle_map: { ...(current.shuffle_map || {}), ...(newConfig.shuffle_map || {}) },
    updated_at: new Date().toISOString(),
  };

  setLocal(KEY_SHUFFLE_CONFIG, merged);

  if (isSupabaseConfigured && supabase) {
    try {
      const desc = JSON.stringify(merged);
      const { data: existing } = await supabase
        .from("exams")
        .select("id")
        .eq("title", "__SYSTEM_SHUFFLE_CONFIG__")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("exams")
          .update({ description: desc })
          .eq("id", existing.id);
      } else {
        await supabase.from("exams").insert({
          title: "__SYSTEM_SHUFFLE_CONFIG__",
          description: desc,
          duration_minutes: 0,
          status: "draft",
          created_by: "00000000-0000-0000-0000-000000000001",
        });
      }
    } catch (err) {
      console.warn("saveShuffleConfig Supabase error:", err);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("shuffle_config_updated"));
  }

  return merged;
}

// Helper: unpack metadata & infer missing fields from raw exam record
function parseExamRecord(
  rawExam: any,
  recentSubs?: Pick<Submission, "id" | "total_score" | "mcq_score" | "status" | "submitted_at">[],
  shuffleConfig?: ShuffleConfig | null
): Exam {
  let category_id = rawExam.category_id;
  let category_slug = rawExam.category_slug;
  let question_count = rawExam.question_count || rawExam.questions?.length;
  let question_type = rawExam.question_type;
  let expires_at = rawExam.expires_at;
  let is_shuffled = rawExam.is_shuffled === true;
  let cleanDescription = rawExam.description || "";

  // Robust meta extraction from description
  const metaMatch = cleanDescription.match(/^[\s\r\n]*<!--meta:([\s\S]*?)-->/);
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]);
      category_id = category_id || meta.category_id;
      category_slug = category_slug || meta.category_slug;
      question_count = question_count || meta.question_count;
      question_type = question_type || meta.question_type;
      expires_at = expires_at || meta.expires_at;
      if (meta.is_shuffled !== undefined) {
        is_shuffled = Boolean(meta.is_shuffled);
      }
      cleanDescription = cleanDescription.replace(/^[\s\r\n]*<!--meta:[\s\S]*?-->\n?/, "").trim();
    } catch {}
  }

  // Apply shuffleConfig priority
  if (shuffleConfig) {
    if (shuffleConfig.shuffle_map && shuffleConfig.shuffle_map[rawExam.id] !== undefined) {
      is_shuffled = Boolean(shuffleConfig.shuffle_map[rawExam.id]);
    } else if (shuffleConfig.is_global_shuffle) {
      is_shuffled = true;
    }
  } else {
    // If not passed, check localStorage cached shuffle config
    const cachedConfig = getLocal<ShuffleConfig | null>(KEY_SHUFFLE_CONFIG, null);
    if (cachedConfig) {
      if (cachedConfig.shuffle_map && cachedConfig.shuffle_map[rawExam.id] !== undefined) {
        is_shuffled = Boolean(cachedConfig.shuffle_map[rawExam.id]);
      } else if (cachedConfig.is_global_shuffle) {
        is_shuffled = true;
      }
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
    is_shuffled,
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

  let dbExams: Exam[] = [];
  const shuffleConfig = await getShuffleConfig();

  if (isSupabaseConfigured && supabase) {
    try {
      // Lightweight fetch: Select exam columns and lightweight questions(id, type) for counts & type
      let query = supabase.from("exams").select("*, questions(id, type)");
      query = query.not("title", "like", "__SYSTEM_%");
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
        dbExams = (data as any[]).map((exam) => parseExamRecord(exam, dbSubs, shuffleConfig));
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
            .filter((e: any) => !e.title?.startsWith("__SYSTEM_") && (!onlyPublished || e.status === "published"))
            .map((e: any) => parseExamRecord(e, undefined, shuffleConfig));
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
    getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS)
      .filter((e) => !e.title?.startsWith("__SYSTEM_"))
      .map((e) => parseExamRecord(e, undefined, shuffleConfig))
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
  const shuffleConfig = await getShuffleConfig();
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
        return parseExamRecord(data, undefined, shuffleConfig);
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
        return parseExamRecord(found, undefined, shuffleConfig);
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
  }, undefined, shuffleConfig);
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
    is_shuffled?: boolean;
  },
  questionsDraft: ParsedQuestionDraft[]
): Promise<Exam> {
  initStore();
  const currentUser = getCurrentUser();
  const createdBy = currentUser?.id || "00000000-0000-0000-0000-000000000001";
  const examId = `exam_${Date.now()}`;

  const cleanCategorySlug = examData.category_slug || (examData.title.toLowerCase().includes("cnxh") ? "cnxh" : "cnxh");
  const cleanCategoryId = examData.category_id || "cat_cnxh";
  const isShuffled = Boolean(examData.is_shuffled);

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
    is_shuffled: isShuffled,
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
        is_shuffled: isShuffled,
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
            is_shuffled: isShuffled,
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
    is_shuffled?: boolean;
  },
  questionsDraft: ParsedQuestionDraft[]
): Promise<Exam | null> {
  initStore();
  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const allQuestions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);

  const examIdx = exams.findIndex((e) => e.id === examId);
  const isShuffled =
    examData.is_shuffled !== undefined
      ? Boolean(examData.is_shuffled)
      : examIdx !== -1
      ? Boolean(exams[examIdx].is_shuffled)
      : false;

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

  const cleanDesc = (examData.description || "")
    .replace(/^<!--meta:[\s\S]*?-->\n?/, "")
    .trim();
  const meta = {
    category_id: examIdx !== -1 ? exams[examIdx].category_id : undefined,
    category_slug: examIdx !== -1 ? exams[examIdx].category_slug : undefined,
    question_count: updatedQuestionsList.length,
    question_type: examIdx !== -1 ? exams[examIdx].question_type : "multiple_choice",
    is_shuffled: isShuffled,
  };
  const descWithMeta = `<!--meta:${JSON.stringify(meta)}-->\n${cleanDesc}`.trim();

  if (examIdx !== -1) {
    exams[examIdx] = {
      ...exams[examIdx],
      title: examData.title.trim(),
      description: cleanDesc,
      duration_minutes: Number(examData.duration_minutes) || 45,
      status: examData.status,
      is_shuffled: isShuffled,
    };
    setLocal(KEY_EXAMS, exams);
    invalidateExamCache();
  }

  // Replace questions for this examId in localStorage
  const otherQuestions = allQuestions.filter((q) => q.exam_id !== examId);
  setLocal(KEY_QUESTIONS, [...otherQuestions, ...updatedQuestionsList]);

  // Save shuffle state in dedicated config as well
  if (examData.is_shuffled !== undefined) {
    await saveShuffleConfig({
      shuffle_map: { [examId]: Boolean(examData.is_shuffled) },
    });
  }

  // Sync to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const res = await supabase
        .from("exams")
        .update({
          title: examData.title.trim(),
          description: descWithMeta,
          duration_minutes: Number(examData.duration_minutes) || 45,
          status: examData.status,
          is_shuffled: isShuffled,
        })
        .eq("id", examId);

      if (res.error) {
        await supabase
          .from("exams")
          .update({
            title: examData.title.trim(),
            description: descWithMeta,
            duration_minutes: Number(examData.duration_minutes) || 45,
            status: examData.status,
          })
          .eq("id", examId);
      }

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

export async function toggleAllExamsShuffle(enable: boolean): Promise<Exam[]> {
  initStore();
  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const shuffleMap: Record<string, boolean> = {};

  const updatedExams = exams.map((exam) => {
    shuffleMap[exam.id] = enable;
    const cleanDesc = (exam.description || "").replace(/^[\s\r\n]*<!--meta:[\s\S]*?-->\n?/, "").trim();
    const meta = {
      category_id: exam.category_id,
      category_slug: exam.category_slug,
      question_count: exam.question_count || exam.questions?.length || 40,
      question_type: exam.question_type || "multiple_choice",
      is_shuffled: enable,
      expires_at: exam.expires_at || null,
    };
    return {
      ...exam,
      is_shuffled: enable,
      description: cleanDesc,
      _metaDesc: `<!--meta:${JSON.stringify(meta)}-->\n${cleanDesc}`.trim(),
    };
  });

  // 1. Save to dedicated shuffle config (localStorage + Supabase __SYSTEM_SHUFFLE_CONFIG__)
  await saveShuffleConfig({
    is_global_shuffle: enable,
    shuffle_map: shuffleMap,
  });

  // 2. Save exams locally
  const cleaned = updatedExams.map(({ _metaDesc, ...rest }) => rest);
  setLocal(KEY_EXAMS, cleaned);
  invalidateExamCache();

  // 3. Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      for (const item of updatedExams) {
        const res = await supabase
          .from("exams")
          .update({
            description: item._metaDesc,
            is_shuffled: enable,
          })
          .eq("id", item.id);

        if (res.error) {
          await supabase
            .from("exams")
            .update({
              description: item._metaDesc,
            })
            .eq("id", item.id);
        }
      }
    } catch (err) {
      console.warn("toggleAllExamsShuffle Supabase sync error:", err);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("exams_updated"));
  }

  return cleaned;
}

export async function toggleSingleExamShuffle(
  id: string,
  forceValue?: boolean
): Promise<Exam | null> {
  initStore();
  const exams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS);
  const examIndex = exams.findIndex((e) => e.id === id);
  if (examIndex === -1) return null;

  const current = exams[examIndex];
  const nextShuffled =
    forceValue !== undefined ? Boolean(forceValue) : !Boolean(current.is_shuffled);

  // 1. Save to dedicated shuffle config
  await saveShuffleConfig({
    shuffle_map: { [id]: nextShuffled },
  });

  const cleanDesc = (current.description || "").replace(/^[\s\r\n]*<!--meta:[\s\S]*?-->\n?/, "").trim();
  const meta = {
    category_id: current.category_id,
    category_slug: current.category_slug,
    question_count: current.question_count || current.questions?.length || 40,
    question_type: current.question_type || "multiple_choice",
    is_shuffled: nextShuffled,
    expires_at: current.expires_at || null,
  };
  const descWithMeta = `<!--meta:${JSON.stringify(meta)}-->\n${cleanDesc}`.trim();

  const updated: Exam = {
    ...current,
    is_shuffled: nextShuffled,
    description: cleanDesc,
  };
  exams[examIndex] = updated;
  setLocal(KEY_EXAMS, exams);
  invalidateExamCache();

  // 2. Sync to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const res = await supabase
        .from("exams")
        .update({
          description: descWithMeta,
          is_shuffled: nextShuffled,
        })
        .eq("id", id);

      if (res.error) {
        await supabase
          .from("exams")
          .update({
            description: descWithMeta,
          })
          .eq("id", id);
      }
    } catch (err) {
      console.warn("toggleSingleExamShuffle Supabase error:", err);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("exams_updated"));
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

  const exam = await getExamById(examId);
  if (!exam || !exam.questions) {
    throw new Error("Không tìm thấy dữ liệu đề thi.");
  }

  let mcqScore = 0;
  let hasEssay = false;

  const rawAnswersForGrading: {
    question_id: string;
    user_answer: string;
    is_correct: boolean | null;
    score_awarded: number;
    admin_feedback: string | null;
  }[] = [];

  for (const question of exam.questions) {
    const rawAnswer = (userAnswers[question.id] || "").trim();

    if (question.type === "multiple_choice") {
      const optionsWithIds = getQuestionOptionsWithIds(question);
      const correctOption = optionsWithIds.find((o) => o.is_correct);
      const correctOptionId = correctOption?.id || "";

      // Lookup candidate's selected option by option_id, original letter, or matching option text
      const selectedOption = optionsWithIds.find(
        (o) =>
          o.id === rawAnswer ||
          o.original_letter.toUpperCase() === rawAnswer.toUpperCase() ||
          rawAnswer.toUpperCase().startsWith(o.original_letter.toUpperCase()) ||
          o.raw_text.trim().toLowerCase() === rawAnswer.trim().toLowerCase() ||
          o.clean_text.trim().toLowerCase() === rawAnswer.trim().toLowerCase()
      );

      // Requirement 4: Compare selected_option_id with correct_option_id for 100% accurate grading
      const selectedOptionId = selectedOption?.id || rawAnswer;
      const isCorrect = Boolean(
        selectedOptionId &&
          correctOptionId &&
          selectedOptionId === correctOptionId
      );

      // Award exact configured max_score for this MCQ question
      const questionMaxScore =
        Number(question.max_score) > 0 ? Number(question.max_score) : 1;
      const scoreAwarded = isCorrect
        ? Math.round(questionMaxScore * 100) / 100
        : 0;
      mcqScore = Math.round((mcqScore + scoreAwarded) * 100) / 100;

      rawAnswersForGrading.push({
        question_id: question.id,
        user_answer: selectedOption ? selectedOption.original_letter : rawAnswer,
        is_correct: isCorrect,
        score_awarded: scoreAwarded,
        admin_feedback: null,
      });
    } else {
      hasEssay = true;
      rawAnswersForGrading.push({
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

  let finalSubmissionId = `sub_${Date.now()}`;
  let submittedAt = new Date().toISOString();

  // 1. Live insert into Supabase Database first
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: insertedSub, error: subError } = await supabase
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

      if (!subError && insertedSub) {
        finalSubmissionId = insertedSub.id;
        submittedAt = insertedSub.submitted_at;

        const dbAnswers = rawAnswersForGrading.map((a) => ({
          submission_id: finalSubmissionId,
          question_id: a.question_id,
          user_answer: a.user_answer,
          is_correct: a.is_correct,
          score_awarded: a.score_awarded,
          admin_feedback: a.admin_feedback,
        }));
        await supabase.from("submission_answers").insert(dbAnswers);

        // FIFO Rolling Window: Giữ tối đa 10 bài nộp mới nhất trong hệ thống.
        // Khi đạt đến 10 bài và nộp bài mới (#1), bài thứ 10 cũ (bài 11) sẽ tự động bị xóa.
        try {
          const { data: allDbSubs } = await supabase
            .from("submissions")
            .select("id")
            .order("submitted_at", { ascending: false });

          if (allDbSubs && allDbSubs.length > 10) {
            const idsToDelete = allDbSubs.slice(10).map((s: any) => s.id);
            if (idsToDelete.length > 0) {
              await supabase.from("submissions").delete().in("id", idsToDelete);
            }
          }
        } catch (purgeErr) {
          console.warn("FIFO rolling purge error in Supabase:", purgeErr);
        }
      }
    } catch (e) {
      console.warn("Supabase submitExam error:", e);
    }
  }

  const submissionAnswers: SubmissionAnswer[] = rawAnswersForGrading.map((a) => ({
    id: `ans_${Date.now()}_${a.question_id}`,
    submission_id: finalSubmissionId,
    question_id: a.question_id,
    user_answer: a.user_answer,
    is_correct: a.is_correct,
    score_awarded: a.score_awarded,
    admin_feedback: a.admin_feedback,
  }));

  const newSubmission: Submission = {
    id: finalSubmissionId,
    exam_id: examId,
    user_id: userId,
    status,
    mcq_score: mcqScore,
    essay_score: essayScore,
    total_score: totalScore,
    submitted_at: submittedAt,
    exam,
    answers: submissionAnswers,
  };

  // Sync to local fallback cache as backup (Tối đa 10 bài gần nhất)
  const existingSubmissions = getLocal<Submission[]>(KEY_SUBMISSIONS, SEED_SUBMISSIONS);
  const existingAnswers = getLocal<SubmissionAnswer[]>(KEY_SUBMISSION_ANSWERS, SEED_SUBMISSION_ANSWERS);

  const allSubmissions = [newSubmission, ...existingSubmissions.filter((s) => s.id !== finalSubmissionId)]
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  // FIFO Rolling: Giữ đúng 10 bài mới nhất (bài mới = #1, bài thứ 11 tự động xóa)
  const retainedSubmissions = allSubmissions.slice(0, 10);
  const retainedIds = new Set(retainedSubmissions.map((s) => s.id));
  const retainedAnswers = [...existingAnswers, ...submissionAnswers].filter(
    (a) => retainedIds.has(a.submission_id)
  );

  setLocal(KEY_SUBMISSIONS, retainedSubmissions);
  setLocal(KEY_SUBMISSION_ANSWERS, retainedAnswers);

  return newSubmission;
}

export async function getSubmissions(userId?: string): Promise<Submission[]> {
  initStore();

  // 1. Live Supabase fetch (Tối đa 10 bài mới nhất)
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from("submissions")
        .select(
          "id, exam_id, user_id, status, mcq_score, essay_score, total_score, submitted_at, exam:exams(id, title, duration_minutes, questions(id, max_score, type)), user:profiles(id, username, role)"
        )
        .order("submitted_at", { ascending: false })
        .limit(10);

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
        return mapped.slice(0, 10);
      }
    } catch (e) {
      console.warn("Supabase getSubmissions failed:", e);
    }
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
    return enriched.filter((s) => s.user_id === userId).slice(0, 10);
  }
  return enriched.slice(0, 10);
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  initStore();

  // 1. Live Supabase fetch with questions & answers for grading / review
  if (isSupabaseConfigured && supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let data: any = null;
      let error: any = null;

      if (isUuid) {
        const res = await supabase
          .from("submissions")
          .select("*, exam:exams(*, questions(*)), user:profiles(*), answers:submission_answers(*)")
          .eq("id", id)
          .maybeSingle();
        data = res.data;
        error = res.error;
      }

      if (!error && data) {
        const sortedQuestions = data.exam?.questions || [];
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
    } catch (e) {
      console.warn("Supabase getSubmissionById failed:", e);
    }
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

  let calculatedEssayScore = 0;
  for (const grade of essayGrades) {
    calculatedEssayScore += Math.round((Number(grade.score) || 0) * 100) / 100;
  }
  calculatedEssayScore = Math.round(calculatedEssayScore * 100) / 100;

  if (isSupabaseConfigured && supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId);
      if (isUuid) {
        const { data: currentSub } = await supabase
          .from("submissions")
          .select("mcq_score")
          .eq("id", submissionId)
          .maybeSingle();

        const mcqScore = Number(currentSub?.mcq_score) || 0;
        const finalTotalScore = Math.round((mcqScore + calculatedEssayScore) * 100) / 100;

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

        return await getSubmissionById(submissionId);
      }
    } catch (e) {
      console.warn("Supabase finalizeGrading error:", e);
    }
  }

  // Local fallback
  const submissions = getLocal<Submission[]>(KEY_SUBMISSIONS, SEED_SUBMISSIONS);
  const answers = getLocal<SubmissionAnswer[]>(KEY_SUBMISSION_ANSWERS, SEED_SUBMISSION_ANSWERS);

  const subIndex = submissions.findIndex((s) => s.id === submissionId);
  if (subIndex === -1) return null;

  const sub = submissions[subIndex];

  const updatedAnswers = answers.map((ans) => {
    if (ans.submission_id === submissionId) {
      const grade = essayGrades.find((g) => g.questionId === ans.question_id);
      if (grade) {
        const cleanGradeScore = Math.round((Number(grade.score) || 0) * 100) / 100;
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

  return updatedSubmission;
}



export async function getAllProfiles(): Promise<Profile[]> {
  initStore();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, role, created_at")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        return data as Profile[];
      }
    } catch {}
  }
  const profiles = getLocal<Profile[]>(KEY_PROFILES, SEED_PROFILES);
  return profiles;
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

export async function adminCreateAccount(
  username: string,
  password: string,
  role: "user" | "admin" = "user"
): Promise<{ success: boolean; message: string; user?: Profile }> {
  try {
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_account",
        username,
        password,
        role,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || "Không thể tạo tài khoản.",
      };
    }

    // Also update local profiles so UI updates immediately
    initStore();
    const cleanUser = username.trim().toLowerCase();
    const localProfiles = getLocal<Profile[]>(KEY_PROFILES, SEED_PROFILES);
    if (!localProfiles.some((p) => p.username.toLowerCase() === cleanUser)) {
      const newProf: Profile = {
        id: crypto.randomUUID(),
        username: cleanUser,
        role,
        is_active: true,
        password_hash: password,
        created_at: new Date().toISOString(),
      };
      setLocal(KEY_PROFILES, [...localProfiles, newProf]);
    }

    return {
      success: true,
      message: data.message || `Đã tạo tài khoản '${cleanUser}' thành công.`,
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

// =========================================================================
// STUDY MATERIALS & MAGAZINE VIEW MODULE
// =========================================================================

export const SEED_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: "mat_cnxh_1",
    title: "Chủ nghĩa Xã hội Khoa học: Bản chất, Quy luật và Sứ mệnh Lịch sử của Giai cấp Công nhân",
    category_id: "cat_cnxh",
    category_slug: "cnxh",
    category_name: "Chủ nghĩa xã hội (CNXH)",
    summary: "Tổng kết toàn diện về điều kiện kinh tế - xã hội dẫn tới sự ra đời của CNXH khoa học, quy luật chuyển biến xã hội và địa vị lịch sử - kinh tế của giai cấp công nhân trong kỷ nguyên hiện đại.",
    reading_time: 8,
    author: "Hội đồng Giảng huấn Lý luận Chính trị",
    created_at: "2026-10-10T08:00:00.000Z",
    content_html: `
      <h2>1. Điều kiện Kinh tế - Xã hội và Tiền đề Lý luận</h2>
      <p class="leading-relaxed">Chủ nghĩa xã hội khoa học (CNXHKH) ra đời vào những năm 40 của thế kỷ XIX, là kết quả tất yếu của sự phát triển phương thức sản xuất tư bản chủ nghĩa và sự trưởng thành của phong trào công nhân quốc tế.</p>
      
      <div class="callout-box bg-[#1a1d2e] border-l-4 border-cyan-400 p-4 rounded-r-xl my-4 shadow-sm">
        <p class="font-bold text-cyan-300 text-sm flex items-center gap-2">💡 Khái niệm Cốt lõi Cần Nắm:</p>
        <p class="text-xs text-slate-300 mt-1">Sự xuất hiện của giai cấp vô sản công nghiệp trên vũ đài lịch sử với tư cách là một lực lượng chính trị độc lập đã đòi hỏi bức thiết một hệ tư tưởng khoa học dẫn đường. Ba phong trào công nhân tiêu biểu (Dệt Lyon - Pháp, Hiến chương Anh, Dệt Silesia - Đức) chính là tiền đề thực tiễn trực tiếp.</p>
      </div>

      <h3>1.1. Ba phát kiến vĩ đại của C.Mác và Ph.Ăngghen</h3>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300 my-3">
        <li><strong>Chủ nghĩa duy vật lịch sử:</strong> Làm sáng tỏ quy luật vận động nội tại của các hình thái kinh tế - xã hội và quy luật đấu tranh giai cấp.</li>
        <li><strong>Học thuyết giá trị thặng dư:</strong> Vạch trần bản chất bóc lột của phương thức sản xuất tư bản chủ nghĩa dưới vỏ bọc tự do trao đổi hàng hóa.</li>
        <li><strong>Sứ mệnh lịch sử của giai cấp công nhân:</strong> Chỉ ra lực lượng xã hội tiên phong có khả năng lãnh đạo công cuộc giải phóng nhân loại.</li>
      </ul>

      <h2>2. Sứ mệnh Lịch sử Toàn thế giới của Giai cấp Công nhân</h2>
      <p class="leading-relaxed">Nội dung cốt lõi trong sứ mệnh lịch sử của giai cấp công nhân là xóa bỏ chế độ áp bức bóc lột tư bản chủ nghĩa, giải phóng giai cấp mình và toàn thể nhân dân lao động, từng bước xây dựng thành công xã hội cộng sản chủ nghĩa văn minh.</p>

      <div class="overflow-x-auto my-5">
        <table class="w-full border-collapse border border-white/10 text-xs text-left">
          <thead>
            <tr class="bg-indigo-950/60 text-indigo-200 border-b border-white/10">
              <th class="p-3 font-semibold">Lĩnh vực Trọng tâm</th>
              <th class="p-3 font-semibold">Nhiệm vụ Chiến lược</th>
              <th class="p-3 font-semibold">Mục tiêu Hướng tới</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-slate-300">
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-cyan-300">Chính trị - Xã hội</td>
              <td class="p-3">Đập tan ách thống trị của giai cấp bóc lột, thiết lập nhà nước chuyên chính vô sản.</td>
              <td class="p-3">Xây dựng và hoàn thiện nền dân chủ xã hội chủ nghĩa chân chính.</td>
            </tr>
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-purple-300">Kinh tế</td>
              <td class="p-3">Xác lập chế độ công hữu về tư liệu sản xuất chủ yếu, giải phóng sức sản xuất.</td>
              <td class="p-3">Nâng cao đời sống vật chất, phân phối theo lao động và nhu cầu.</td>
            </tr>
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-amber-300">Tư tưởng - Văn hóa</td>
              <td class="p-3">Xác lập vị trí thống trị của hệ tư tưởng Mác - Lênin, xây dựng nền văn hóa mới.</td>
              <td class="p-3">Giải phóng con người toàn diện về tư duy, đạo đức và thẩm mỹ.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>3. Đặc điểm của Giai cấp Công nhân Việt Nam</h2>
      <p class="leading-relaxed">Giai cấp công nhân Việt Nam sinh ra và lớn lên trong một xã hội thuộc địa nửa phong kiến, chịu ách áp bức nặng nề của đế quốc và phong kiến.</p>
      
      <div class="callout-box bg-[#1c2235] border-l-4 border-amber-400 p-4 rounded-r-xl my-4 shadow-sm">
        <p class="font-bold text-amber-300 text-sm">⚠️ Phân tích Đặc thù Việt Nam:</p>
        <p class="text-xs text-slate-300 mt-1">Giai cấp công nhân Việt Nam ra đời trước giai cấp tư sản dân tộc, sớm tiếp thu ánh sáng chủ nghĩa Mác - Lênin thông qua Nguyễn Ái Quốc, có mối quan hệ tự nhiên gắn bó máu thịt với giai cấp nông dân - lực lượng cách mạng đông đảo nhất.</p>
      </div>

      <h2>4. Câu hỏi Ôn tập Trọng tâm</h2>
      <ol class="list-decimal pl-5 space-y-1.5 text-slate-300 my-3 text-xs">
        <li>Phân tích điều kiện khách quan và nhân tố chủ quan quy định sứ mệnh lịch sử của giai cấp công nhân?</li>
        <li>Tại sao nói Đảng Cộng sản là nhân tố quyết định nhất để giai cấp công nhân hoàn thành sứ mệnh lịch sử?</li>
        <li>Những biến đổi của giai cấp công nhân hiện đại trong bối cảnh cuộc Cách mạng Công nghiệp lần thứ tư (4.0)?</li>
      </ol>
    `,
  },
  {
    id: "mat_cnxh_2",
    title: "Thời kỳ Quá độ lên Chủ nghĩa Xã hội & Bản chất Nền Dân chủ Xã hội Chủ nghĩa",
    category_id: "cat_cnxh",
    category_slug: "cnxh",
    category_name: "Chủ nghĩa xã hội (CNXH)",
    summary: "Hệ thống hóa luận điểm về tính tất yếu lịch sử của thời kỳ quá độ, đặc điểm quá độ gián tiếp bỏ qua chế độ tư bản chủ nghĩa tại Việt Nam và cơ chế thực thi dân chủ XHCN.",
    reading_time: 6,
    author: "Viện Nghiên cứu Chủ nghĩa Mác - Lênin",
    created_at: "2026-10-10T14:30:00.000Z",
    content_html: `
      <h2>1. Tính Tất yếu và Đặc điểm của Thời kỳ Quá độ</h2>
      <p class="leading-relaxed">Thời kỳ quá độ lên chủ nghĩa xã hội là thời kỳ cải biến cách mạng sâu sắc, toàn diện trên tất cả các lĩnh vực đời sống xã hội từ xã hội cũ sang xã hội mới XHCN.</p>

      <div class="callout-box bg-[#1a1d2e] border-l-4 border-indigo-400 p-4 rounded-r-xl my-4 shadow-sm">
        <p class="font-bold text-indigo-300 text-sm flex items-center gap-2">📌 Hai Hình thức Quá độ Lịch sử:</p>
        <p class="text-xs text-slate-300 mt-1"><strong>Quá độ trực tiếp:</strong> Từ chủ nghĩa tư bản phát triển lên chủ nghĩa cộng sản.<br/><strong>Quá độ gián tiếp:</strong> Từ xã hội tiền tư bản chủ nghĩa đi lên CNXH bỏ qua chế độ tư bản chủ nghĩa (như Việt Nam, Trung Quốc, Cuba).</p>
      </div>

      <h2>2. Con đường Quá độ Bỏ qua Chế độ Tư bản Chủ nghĩa ở Việt Nam</h2>
      <p class="leading-relaxed">Đại hội IX của Đảng Cộng sản Việt Nam đã làm sáng tỏ: "Bỏ qua chế độ tư bản chủ nghĩa là bỏ qua việc xác lập vị trí thống trị của quan hệ sản xuất và kiến trúc thượng tầng tư bản chủ nghĩa, nhưng tiếp thu, kế thừa những thành tựu mà nhân loại đã đạt được dưới chế độ tư bản".</p>

      <h2>3. Bản chất Nền Dân chủ Xã hội Chủ nghĩa</h2>
      <p class="leading-relaxed">Dân chủ xã hội chủ nghĩa là nền dân chủ cao hơn về chất so với dân chủ tư sản, là nền dân chủ mà ở đó quyền lực thực sự thuộc về nhân dân, do nhân dân làm chủ.</p>

      <div class="overflow-x-auto my-5">
        <table class="w-full border-collapse border border-white/10 text-xs text-left">
          <thead>
            <tr class="bg-indigo-950/60 text-indigo-200 border-b border-white/10">
              <th class="p-3 font-semibold">Tiêu chí So sánh</th>
              <th class="p-3 font-semibold">Dân chủ Tư sản</th>
              <th class="p-3 font-semibold">Dân chủ Xã hội Chủ nghĩa</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-slate-300">
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-slate-200">Bản chất Giai cấp</td>
              <td class="p-3">Phục vụ lợi ích của thiểu số giai cấp tư sản.</td>
              <td class="p-3 text-emerald-300 font-medium">Bản chất của giai cấp công nhân, phục vụ đa số nhân dân.</td>
            </tr>
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-slate-200">Cơ sở Kinh tế</td>
              <td class="p-3">Dựa trên chế độ tư hữu về tư liệu sản xuất.</td>
              <td class="p-3 text-emerald-300 font-medium">Dựa trên chế độ công hữu về các tư liệu sản xuất chủ yếu.</td>
            </tr>
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-slate-200">Phương thức Thực hiện</td>
              <td class="p-3">Hình thức pháp lý danh nghĩa, tiền tài chi phối.</td>
              <td class="p-3 text-emerald-300 font-medium">Dân chủ đại diện kết hợp trực tiếp ("Dân biết, dân bàn, dân làm, dân kiểm tra").</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  },
  {
    id: "mat_ctmt_1",
    title: "Kiến trúc Máy tính Hiện đại: Mô hình Von Neumann, Pipeline CPU và Phân cấp Bộ nhớ Cache",
    category_id: "cat_ctmthdh",
    category_slug: "ctmthdh",
    category_name: "Cấu trúc máy tính & Hệ điều hành",
    summary: "Khảo sát chuyên sâu cấu trúc vi xử lý hiện đại: chu trình lệnh Fetch-Decode-Execute, kỹ thuật đường ống lệnh 5 tầng, hiện tượng Pipeline Hazards và ma trận so sánh tốc độ phân cấp bộ nhớ Cache L1/L2/L3.",
    reading_time: 10,
    author: "Bộ môn Kỹ thuật Máy tính & Vi xử lý",
    created_at: "2026-10-11T09:15:00.000Z",
    content_html: `
      <h2>1. Mô hình Kiến trúc Von Neumann</h2>
      <p class="leading-relaxed">Kiến trúc Von Neumann là nền tảng của hầu hết máy tính số hiện đại, được xây dựng dựa trên nguyên lý chương trình lưu trữ (Stored-program concept): cả lệnh và dữ liệu đều được lưu trữ trong cùng một bộ nhớ chính.</p>

      <div class="callout-box bg-[#1a1d2e] border-l-4 border-cyan-400 p-4 rounded-r-xl my-4 shadow-sm">
        <p class="font-bold text-cyan-300 text-sm">💡 Von Neumann Bottleneck (Nút thắt cổ chai):</p>
        <p class="text-xs text-slate-300 mt-1">Do lệnh và dữ liệu dùng chung bus truyền dữ liệu, CPU không thể vừa tìm nạp lệnh (Fetch) vừa đọc/ghi dữ liệu (Data Access) đồng thời trên cùng một chu kỳ bus. Kiến trúc Harvard khắc phục điều này bằng cách tách riêng bus lệnh và bus dữ liệu.</p>
      </div>

      <h2>2. Kỹ thuật Đường ống Lệnh (Instruction Pipelining)</h2>
      <p class="leading-relaxed">Pipelining là kỹ thuật chia quá trình thực thi một lệnh thành nhiều giai đoạn độc lập (stages), cho phép CPU xử lý đồng thời nhiều lệnh tại các giai đoạn khác nhau trên cùng một chu kỳ xung nhịp (Clock Cycle).</p>

      <h3>2.1. Năm Giai đoạn Kinh điển của MIPS Pipeline (5-Stage)</h3>
      <ol class="list-decimal pl-5 space-y-1.5 text-slate-300 my-3 text-xs">
        <li><strong>IF (Instruction Fetch):</strong> Tìm nạp lệnh từ bộ nhớ thông qua con trỏ lệnh PC (Program Counter).</li>
        <li><strong>ID (Instruction Decode):</strong> Giải mã mã lệnh (Opcode) và đọc dữ liệu từ các thanh ghi (Register File).</li>
        <li><strong>EX (Execute):</strong> Khối số học logic (ALU) thực hiện tính toán số học hoặc tính toán địa chỉ bộ nhớ.</li>
        <li><strong>MEM (Memory Access):</strong> Đọc dữ liệu từ RAM hoặc ghi dữ liệu ra RAM (nếu lệnh là Load / Store).</li>
        <li><strong>WB (Write Back):</strong> Ghi kết quả tính toán ngược trở lại thanh ghi đích.</li>
      </ol>

      <h3>2.2. Các Xung đột trong Pipeline (Hazards)</h3>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300 my-3">
        <li><strong>Structural Hazard:</strong> Xung đột tài nguyên phần cứng (ví dụ: 2 lệnh cùng truy cập 1 cổng bộ nhớ).</li>
        <li><strong>Data Hazard (RAW, WAR, WAW):</strong> Lệnh sau cần dữ liệu của lệnh trước khi lệnh trước chưa kịp ghi kết quả (Khắc phục bằng Data Forwarding).</li>
        <li><strong>Control Hazard:</strong> Xảy ra khi gặp các lệnh rẽ nhánh (Branch / Jump), CPU chưa biết lệnh tiếp theo cần fetch là gì (Khắc phục bằng Branch Prediction).</li>
      </ul>

      <h2>3. Cấu trúc Phân cấp Bộ nhớ (Memory Hierarchy)</h2>
      <div class="overflow-x-auto my-5">
        <table class="w-full border-collapse border border-white/10 text-xs text-left">
          <thead>
            <tr class="bg-indigo-950/60 text-indigo-200 border-b border-white/10">
              <th class="p-3 font-semibold">Tầng Bộ nhớ</th>
              <th class="p-3 font-semibold">Thời gian Truy cập</th>
              <th class="p-3 font-semibold">Dung lượng Tiêu biểu</th>
              <th class="p-3 font-semibold">Công nghệ Chế tạo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-slate-300">
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-cyan-300">Registers (Thanh ghi)</td>
              <td class="p-3 font-mono">&lt; 1 ns (1 clock)</td>
              <td class="p-3 font-mono">1 - 2 KB</td>
              <td class="p-3">Flip-Flop mạch tích hợp CPU</td>
            </tr>
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-purple-300">L1 Cache</td>
              <td class="p-3 font-mono">1 - 2 ns (4 clocks)</td>
              <td class="p-3 font-mono">32 - 128 KB</td>
              <td class="p-3">SRAM On-die per core</td>
            </tr>
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-indigo-300">L2 / L3 Cache</td>
              <td class="p-3 font-mono">3 - 15 ns (10-40 clocks)</td>
              <td class="p-3 font-mono">1 - 32 MB+</td>
              <td class="p-3">SRAM Shared / Dedicated</td>
            </tr>
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-amber-300">RAM (Bộ nhớ chính)</td>
              <td class="p-3 font-mono">50 - 100 ns</td>
              <td class="p-3 font-mono">8 - 64 GB</td>
              <td class="p-3">DRAM (DDR4 / DDR5)</td>
            </tr>
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-slate-400">SSD NVMe / HDD</td>
              <td class="p-3 font-mono">10 - 100 µs (SSD)</td>
              <td class="p-3 font-mono">512 GB - 2 TB+</td>
              <td class="p-3">NAND Flash Memory</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  },
  {
    id: "mat_ctmt_2",
    title: "Hệ Điều Hành: Quản lý Tiến trình (Process), Điều phối Luồng (Thread) & Lập lịch CPU",
    category_id: "cat_ctmthdh",
    category_slug: "ctmthdh",
    category_name: "Cấu trúc máy tính & Hệ điều hành",
    summary: "Mô hình chuyển trạng thái tiến trình (5-State Transition), khối điều khiển PCB, phân biệt sự khác nhau giữa Process vs Thread trong nhân OS, và so sánh chi tiết các thuật toán điều phối CPU (FCFS, SJF, Round Robin).",
    reading_time: 7,
    author: "Tổ Hệ điều hành & Hệ thống Nhúng",
    created_at: "2026-10-11T16:45:00.000Z",
    content_html: `
      <h2>1. Khái niệm Tiến trình (Process) và PCB</h2>
      <p class="leading-relaxed">Tiến trình là một chương trình đang trong quá trình thực thi, bao gồm mã chương trình (Code), con trỏ lệnh (PC), nội dung các thanh ghi CPU và vùng nhớ ngăn xếp (Stack), vùng nhớ heap.</p>

      <div class="callout-box bg-[#1a1d2e] border-l-4 border-emerald-400 p-4 rounded-r-xl my-4 shadow-sm">
        <p class="font-bold text-emerald-300 text-sm">💡 Cấu trúc Khối Điều khiển Tiến trình (PCB - Process Control Block):</p>
        <p class="text-xs text-slate-300 mt-1">Hệ điều hành quản lý mỗi tiến trình thông qua PCB, gồm: <code>Process ID (PID)</code>, Trạng thái (Process State), Ngữ cảnh thanh ghi (CPU Registers), Thông tin lập lịch CPU (Độ ưu tiên), Giới hạn bộ nhớ (Memory Limits) và Danh sách tệp đang mở (Open Files).</p>
      </div>

      <h2>2. Mô hình Chuyển đổi 5 Trạng thái của Tiến trình</h2>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300 my-3">
        <li><strong>New (Mới tạo):</strong> Tiến trình đang được tạo lập trong bộ nhớ.</li>
        <li><strong>Ready (Sẵn sàng):</strong> Tiến trình đã nạp đủ vào RAM, nằm trong hàng đợi sẵn sàng chờ được cấp phát CPU.</li>
        <li><strong>Running (Đang chạy):</strong> Tiến trình đang chiếm dụng CPU và thực thi các câu lệnh.</li>
        <li><strong>Waiting / Blocked (Chờ / Nghẽn):</strong> Tiến trình tạm dừng chờ một sự kiện I/O hoặc tín hiệu đồng bộ.</li>
        <li><strong>Terminated (Kết thúc):</strong> Tiến trình đã thực thi xong hoặc bị hủy bởi hệ điều hành.</li>
      </ul>

      <h2>3. So sánh Tiến trình (Process) và Luồng (Thread)</h2>
      <div class="overflow-x-auto my-5">
        <table class="w-full border-collapse border border-white/10 text-xs text-left">
          <thead>
            <tr class="bg-indigo-950/60 text-indigo-200 border-b border-white/10">
              <th class="p-3 font-semibold">Đặc tính</th>
              <th class="p-3 font-semibold">Tiến trình (Process)</th>
              <th class="p-3 font-semibold">Luồng (Thread)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-slate-300">
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-slate-200">Không gian Địa chỉ</td>
              <td class="p-3">Cô lập độc lập hoàn toàn, không thể ghi vào RAM của tiến trình khác.</td>
              <td class="p-3 text-cyan-300">Dùng chung không gian địa chỉ, code và data của tiến trình cha.</td>
            </tr>
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-slate-200">Chi phí Chuyển ngữ cảnh</td>
              <td class="p-3">Rất cao (Phải lưu trữ TLB, bảng trang nhớ, thanh ghi).</td>
              <td class="p-3 text-cyan-300">Rất thấp (Chỉ cần lưu trữ PC, con trỏ stack và thanh ghi).</td>
            </tr>
            <tr class="hover:bg-white/[0.02]">
              <td class="p-3 font-mono font-medium text-slate-200">Giao tiếp Dữ liệu</td>
              <td class="p-3">Phải thông qua IPC (Pipes, Sockets, Shared Memory).</td>
              <td class="p-3 text-cyan-300">Giao tiếp trực tiếp qua biến toàn cục (Cần khóa đồng bộ Mutex/Semaphore).</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>4. Các Thuật toán Lập lịch CPU Kinh điển</h2>
      <p class="leading-relaxed">Mục tiêu lập lịch: Tối đa hóa hiệu suất CPU Utilization, giảm thiểu Thời gian hoàn thành (Turnaround Time) và Thời gian chờ đợi (Waiting Time).</p>
      <ul class="list-disc pl-5 space-y-1.5 text-slate-300 my-3 text-xs">
        <li><strong>FCFS (First-Come, First-Served):</strong> Đến trước phục vụ trước. Đơn giản nhưng dễ gặp hiệu ứng đoàn tàu (Convoy Effect).</li>
        <li><strong>SJF (Shortest Job First):</strong> Tiến trình có CPU burst ngắn nhất chạy trước. Tối ưu thời gian chờ trung bình, nhưng có thể gây bỏ đói (Starvation) các tiến trình dài.</li>
        <li><strong>Round Robin (RR):</strong> Phân chia thời gian (Time Quantum q). Mỗi tiến trình được chạy tối đa q thời gian rồi bị hoán đổi (Preemptive). Rất phù hợp cho hệ thống đa nhiệm tương tác.</li>
      </ul>
    `,
  },
];

export async function getStudyMaterials(
  categorySlugOrId?: string
): Promise<StudyMaterial[]> {
  initStore();
  let materials: StudyMaterial[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("id, description")
        .eq("title", "__SYSTEM_STUDY_MATERIALS__")
        .maybeSingle();

      if (!error && data && data.description) {
        materials = JSON.parse(data.description);
      }
    } catch {}
  }

  if (materials.length === 0) {
    materials = getLocal<StudyMaterial[]>(
      KEY_STUDY_MATERIALS,
      SEED_STUDY_MATERIALS
    );
  }

  if (categorySlugOrId && categorySlugOrId !== "all") {
    const filter = categorySlugOrId.toLowerCase();
    materials = materials.filter(
      (m) =>
        m.category_id.toLowerCase() === filter ||
        (m.category_slug && m.category_slug.toLowerCase() === filter)
    );
  }

  return materials.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getStudyMaterialById(
  id: string
): Promise<StudyMaterial | null> {
  const all = await getStudyMaterials();
  return all.find((m) => m.id === id) || null;
}

export async function saveStudyMaterial(
  materialData: Partial<StudyMaterial>
): Promise<StudyMaterial> {
  initStore();
  const all = await getStudyMaterials();
  const existingIdx = all.findIndex((m) => m.id === materialData.id);

  const categories = await getCategories(false);
  const matchedCat = categories.find(
    (c) => c.id === materialData.category_id || c.slug === materialData.category_id
  );

  const textContent = (materialData.content_html || "").replace(/<[^>]+>/g, " ").trim();
  const words = textContent.split(/\s+/).filter(Boolean).length;
  const calculatedReadingTime = Math.max(1, Math.round(words / 180));

  let savedItem: StudyMaterial;

  if (existingIdx !== -1) {
    savedItem = {
      ...all[existingIdx],
      ...materialData,
      category_name: matchedCat ? matchedCat.name : all[existingIdx].category_name,
      category_slug: matchedCat ? matchedCat.slug : all[existingIdx].category_slug,
      reading_time: materialData.reading_time || calculatedReadingTime,
      updated_at: new Date().toISOString(),
    } as StudyMaterial;
    all[existingIdx] = savedItem;
  } else {
    savedItem = {
      id: materialData.id || `mat_${crypto.randomUUID()}`,
      title: materialData.title || "Tài liệu học tập mới",
      category_id: materialData.category_id || (categories[0]?.id || "cat_cnxh"),
      category_name: matchedCat ? matchedCat.name : (categories[0]?.name || "Chuyên đề"),
      category_slug: matchedCat ? matchedCat.slug : (categories[0]?.slug || "cnxh"),
      summary: materialData.summary || "",
      content_html: materialData.content_html || "<p>Nội dung đang được cập nhật...</p>",
      reading_time: materialData.reading_time || calculatedReadingTime,
      original_file_url: materialData.original_file_url,
      original_file_name: materialData.original_file_name,
      author: materialData.author || "Ban Giảng huấn",
      created_at: new Date().toISOString(),
    };
    all.unshift(savedItem);
  }

  setLocal(KEY_STUDY_MATERIALS, all);
  await syncStudyMaterialsToSupabase(all);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("materials_updated"));
  }

  return savedItem;
}

export async function deleteStudyMaterial(id: string): Promise<boolean> {
  initStore();
  const all = await getStudyMaterials();
  const filtered = all.filter((m) => m.id !== id);
  setLocal(KEY_STUDY_MATERIALS, filtered);
  await syncStudyMaterialsToSupabase(filtered);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("materials_updated"));
  }

  return true;
}

export async function syncStudyMaterialsToSupabase(
  materials: StudyMaterial[]
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: existing } = await supabase
      .from("exams")
      .select("id")
      .eq("title", "__SYSTEM_STUDY_MATERIALS__")
      .maybeSingle();

    const desc = JSON.stringify(materials);
    if (existing) {
      await supabase
        .from("exams")
        .update({ description: desc })
        .eq("id", existing.id);
    } else {
      await supabase.from("exams").insert({
        title: "__SYSTEM_STUDY_MATERIALS__",
        description: desc,
        duration_minutes: 0,
        status: "draft",
        created_by: "00000000-0000-0000-0000-000000000001",
      });
    }
  } catch (err) {
    console.error("Failed to sync study materials to Supabase:", err);
  }
}


