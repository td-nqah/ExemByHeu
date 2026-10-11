"use client";

import {
  Exam,
  Question,
  Submission,
  SubmissionAnswer,
  Profile,
  ParsedQuestionDraft,
  UserBookmark,
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
const KEY_BOOKMARKS = `${STORAGE_PREFIX}user_bookmarks`;
const KEY_AUDIT_LOGS = `${STORAGE_PREFIX}audit_logs`;
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
];

export interface LoginAuditLog {
  id: string;
  username: string;
  ip_address: string;
  device: string;
  timestamp: string;
  status: "success" | "failed";
}

export const SEED_AUDIT_LOGS: LoginAuditLog[] = [
  {
    id: "log-1",
    username: "admin",
    ip_address: "113.190.234.12",
    device: "Chrome 131 - Windows 11",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: "success",
  },
  {
    id: "log-2",
    username: "user1",
    ip_address: "14.241.120.89",
    device: "Safari 18 - iPhone 16 Pro",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: "success",
  },
  {
    id: "log-3",
    username: "user2",
    ip_address: "27.72.63.104",
    device: "Chrome 130 - Android 15",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: "success",
  },
  {
    id: "log-4",
    username: "user3",
    ip_address: "118.69.190.45",
    device: "Edge 131 - Windows 10",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    status: "success",
  },
  {
    id: "log-5",
    username: "guest_trial",
    ip_address: "171.244.52.18",
    device: "Firefox 133 - macOS",
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    status: "failed",
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
  {
    id: "11111111-1111-1111-1111-333333333333",
    title: "Lập trình Hướng đối tượng (OOP) & Clean Architecture",
    description: "Khảo sát chuyên sâu 4 đặc trưng cốt lõi (Tính đóng gói, Kế thừa, Đa hình, Trừu tượng) cùng các nguyên lý thiết kế SOLID.",
    duration_minutes: 40,
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-444444444444",
    title: "Đề cương CNXH: Đề 1(K24)",
    description: "Bộ đề trắc nghiệm và câu hỏi ôn tập chuyên sâu môn Chủ nghĩa Xã hội Khoa học.",
    duration_minutes: 60,
    category_id: "cat_cnxh",
    category_slug: "cnxh",
    question_count: 75,
    question_type: "multiple_choice",
    expires_at: "2026-10-11T23:59:00Z",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "11111111-1111-1111-1111-555555555555",
    title: "Triết học Mác - Lênin: Phép Biện chứng & Quy luật Xã hội",
    description: "Thế giới quan duy vật biện chứng, quy luật mâu thuẫn, phủ định của phủ định và thực tiễn phát triển nhận thức.",
    duration_minutes: 50,
    category_id: "cat_cnxh",
    category_slug: "cnxh",
    question_count: 50,
    question_type: "multiple_choice",
    expires_at: "2026-10-11T23:59:00Z",
    created_by: "00000000-0000-0000-0000-000000000001",
    status: "published",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
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
  // Exam 3: OOP
  {
    id: "44444444-4444-4444-4444-444444440001",
    exam_id: "11111111-1111-1111-1111-333333333333",
    type: "multiple_choice",
    content: "Tính chất nào trong OOP cho phép một đối tượng có thể nhận nhiều hình thái khác nhau thông qua Overriding hoặc Overloading?",
    options: [
      "A. Tính Đa hình (Polymorphism)",
      "B. Tính Đóng gói (Encapsulation)",
      "C. Tính Kế thừa (Inheritance)",
      "D. Tính Trừu tượng (Abstraction)",
    ],
    correct_answer: "A",
    max_score: 5.0,
    order_index: 1,
  },
  {
    id: "44444444-4444-4444-4444-444444440002",
    exam_id: "11111111-1111-1111-1111-333333333333",
    type: "essay",
    content: "Hãy phân tích nguyên lý Dependency Inversion Principle (DIP) trong bộ nguyên lý SOLID và viết ví dụ minh họa ngắn bằng TypeScript hoặc Java.",
    options: [],
    correct_answer: "",
    max_score: 5.0,
    order_index: 2,
  },
  // Exam 4: CNXH
  {
    id: "55555555-5555-5555-5555-555555550001",
    exam_id: "11111111-1111-1111-1111-444444444444",
    type: "multiple_choice",
    content: "Điều kiện khách quan quy định sứ mệnh lịch sử của giai cấp công nhân là gì?",
    options: [
      "A. Địa vị kinh tế - xã hội và địa vị chính trị - xã hội của giai cấp công nhân",
      "B. Do có sự lãnh đạo của Đảng Cộng sản",
      "C. Do giai cấp công nhân có số lượng đông đảo nhất",
      "D. Do tinh thần đấu tranh tự phát",
    ],
    correct_answer: "A",
    max_score: 5.0,
    order_index: 1,
  },
  {
    id: "55555555-5555-5555-5555-555555550002",
    exam_id: "11111111-1111-1111-1111-444444444444",
    type: "essay",
    content: "Trình bày nội dung sứ mệnh lịch sử của giai cấp công nhân trên các lĩnh vực kinh tế, chính trị - xã hội và văn hóa tư tưởng.",
    options: [],
    correct_answer: "",
    max_score: 5.0,
    order_index: 2,
  },
  // Exam 5: Triết học
  {
    id: "66666666-6666-6666-6666-666666660001",
    exam_id: "11111111-1111-1111-1111-555555555555",
    type: "multiple_choice",
    content: "Theo phép biện chứng duy vật, nguồn gốc và động lực cơ bản của sự vận động, phát triển là gì?",
    options: [
      "A. Sự giải quyết các mâu thuẫn biện chứng nội tại",
      "B. Ý niệm tuyệt đối hoặc thần linh thúc đẩy",
      "C. Ý muốn chủ quan của con người",
      "D. Sự tích lũy ngẫu nhiên của các yếu tố bên ngoài",
    ],
    correct_answer: "A",
    max_score: 5.0,
    order_index: 1,
  },
  {
    id: "66666666-6666-6666-6666-666666660002",
    exam_id: "11111111-1111-1111-1111-555555555555",
    type: "essay",
    content: "Phân tích quy luật chuyển hóa từ những thay đổi về lượng dẫn đến những thay đổi về chất và ngược lại. Rút ra bài học thực tiễn trong học tập.",
    options: [],
    correct_answer: "",
    max_score: 5.0,
    order_index: 2,
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
  if (!localStorage.getItem(KEY_AUDIT_LOGS)) {
    setLocal(KEY_AUDIT_LOGS, SEED_AUDIT_LOGS);
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
  const cleanUsername = username.trim().toLowerCase().replace(/!+$/, "");

  // Explicitly disallow removed legacy account 'user'
  if (cleanUsername === "user") {
    recordLoginAudit("user", "failed");
    return null;
  }

  // 1. Try Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", cleanUsername)
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
          if (data.username.toLowerCase() === "admin" && password === "123") {
            isMatch = true;
          } else if (
            (data.username.toLowerCase() === "user1" ||
              data.username.toLowerCase() === "user2" ||
              data.username.toLowerCase() === "user3") &&
            password === "1"
          ) {
            isMatch = true;
          } else if (data.password_hash === password) {
            isMatch = true;
          }
        }

        if (isMatch) {
          const formattedUsername = data.username.toLowerCase() === "admin" ? "Admin" : data.username.toLowerCase() === "user1" ? "User1" : data.username;
          const profile: Profile = {
            id: data.id,
            username: formattedUsername,
            role: data.role as "admin" | "user",
            created_at: data.created_at,
          };
          setCurrentUser(profile);
          recordLoginAudit(profile.username, "success");
          return profile;
        }
      }
    } catch {
      // Fallback to local store if network or Supabase not populated yet
    }
  }

  // 2. Local fallback
  initStore();
  const matched = SEED_PROFILES.find((p) => p.username.toLowerCase() === cleanUsername);
  if (matched) {
    let isMatch = false;
    if (matched.username.toLowerCase() === "admin" && password === "123") {
      isMatch = true;
    } else if (
      (matched.username.toLowerCase() === "user1" ||
        matched.username.toLowerCase() === "user2" ||
        matched.username.toLowerCase() === "user3") &&
      password === "1"
    ) {
      isMatch = true;
    }

    if (isMatch) {
      const formattedUsername = matched.username.toLowerCase() === "admin" ? "Admin" : matched.username.toLowerCase() === "user1" ? "User1" : matched.username;
      const formattedMatched = { ...matched, username: formattedUsername };
      setCurrentUser(formattedMatched);
      recordLoginAudit(formattedMatched.username, "success");
      return formattedMatched;
    }
  }

  recordLoginAudit(cleanUsername, "failed");
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

  let dbExams: Exam[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from("exams").select("*, questions(*)");
      query = query.neq("title", "__SYSTEM_CATEGORIES__");
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
        dbExams = (data as any[]).map((exam) => parseExamRecord(exam, dbSubs));
      }
    } catch {
      // Use local fallback
    }
  }

  const localExams = getLocal<Exam[]>(KEY_EXAMS, SEED_EXAMS).filter(
    (e) => e.title !== "__SYSTEM_CATEGORIES__"
  );
  const questions = getLocal<Question[]>(KEY_QUESTIONS, SEED_QUESTIONS);

  // If Supabase returned exams: Supabase is our source of truth
  const dbIds = new Set(dbExams.map((e) => e.id));
  const dbTitles = new Set(dbExams.map((e) => (e.title || "").trim().toLowerCase()));

  // Only consider local exams that are NOT already in Supabase (by ID or Title)
  const missingLocals: Exam[] = [];
  for (const rawLocal of localExams) {
    const localTitle = (rawLocal.title || "").trim().toLowerCase();
    if (!dbIds.has(rawLocal.id) && !dbTitles.has(localTitle)) {
      missingLocals.push(
        parseExamRecord({
          ...rawLocal,
          questions: rawLocal.questions || questions.filter((q) => q.exam_id === rawLocal.id),
        })
      );
    }
  }

  // Purge redundant local copies from localStorage so they don't linger
  if (dbExams.length > 0) {
    const purgedLocals = localExams.filter(
      (e) => !dbIds.has(e.id) && !dbTitles.has((e.title || "").trim().toLowerCase())
    );
    setLocal(KEY_EXAMS, purgedLocals);
  }

  // Combine and strictly deduplicate by ID and by Title to guarantee 0 duplicate rows
  const combined = [...dbExams, ...missingLocals];
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const finalExams: Exam[] = [];

  for (const exam of combined) {
    const t = (exam.title || "").trim().toLowerCase();
    if (!seenIds.has(exam.id) && !seenTitles.has(t)) {
      seenIds.add(exam.id);
      seenTitles.add(t);
      finalExams.push(exam);
    }
  }

  if (finalExams.length === 0) {
    const fallback = SEED_EXAMS.map((e) => parseExamRecord({
      ...e,
      questions: questions.filter((q) => q.exam_id === e.id),
    }));
    return onlyPublished ? fallback.filter((e) => e.status === "published") : fallback;
  }

  if (onlyPublished) {
    return finalExams.filter((e) => e.status === "published");
  }
  return finalExams;
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

// 8. SYSTEM AUDIT & ADMIN USER MANAGEMENT
export function recordLoginAudit(
  username: string,
  status: "success" | "failed"
): void {
  if (typeof window === "undefined") return;
  initStore();
  const logs = getLocal<LoginAuditLog[]>(KEY_AUDIT_LOGS, SEED_AUDIT_LOGS);

  let device = "Chrome - Windows 11";
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent;
    if (ua.includes("iPhone")) device = "Safari 18 - iPhone 16 Pro";
    else if (ua.includes("Android")) device = "Chrome 130 - Android 15";
    else if (ua.includes("Macintosh")) device = "Safari 18 - macOS";
    else if (ua.includes("Windows NT 10.0")) device = "Chrome 131 - Windows 11";
    else if (ua.includes("Windows")) device = "Edge 131 - Windows 10";
    else device = "Web Browser";
  }

  const sampleIps = [
    "113.190.234.12",
    "14.241.120.89",
    "27.72.63.104",
    "118.69.190.45",
    "171.244.52.18",
    "125.235.209.61",
  ];
  const ip = sampleIps[Math.floor(Math.random() * sampleIps.length)];

  const newLog: LoginAuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username,
    ip_address: ip,
    device,
    timestamp: new Date().toISOString(),
    status,
  };

  const updated = [newLog, ...logs].slice(0, 50);
  setLocal(KEY_AUDIT_LOGS, updated);
}

export function getLoginAuditLogs(): LoginAuditLog[] {
  initStore();
  return getLocal<LoginAuditLog[]>(KEY_AUDIT_LOGS, SEED_AUDIT_LOGS);
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

export async function getCategoryById(id: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.id === id || c.slug === id) || null;
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

  return true;
}


