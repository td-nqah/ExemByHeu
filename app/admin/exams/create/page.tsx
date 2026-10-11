"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseExamFileWithAI, parseExamTextWithAI } from "@/lib/parsers";
import { createExam, getCategories } from "@/lib/store";
import { ParsedQuestionDraft, Category } from "@/types/exam";
import { QuestionEditorCard } from "@/components/admin/QuestionEditorCard";
import { ScoreConfigPanel } from "@/components/admin/ScoreConfigPanel";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  Plus,
  Send,
  ArrowLeft,
  Layers,
  ClipboardPaste,
  Sparkles,
  Wand2,
  Trash2,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  FolderTree,
  FilePlus2,
  Target,
  Settings,
} from "lucide-react";

const SAMPLE_CLIPBOARD_EXAM = `PHẦN I: TRẮC NGHIỆM KHÁCH QUAN

Câu 1 (1.5 điểm): Trong kiến trúc Next.js App Router, dữ liệu được fetch() tại Server Component mặc định có cơ chế nào?
A. Tự động được xử lý tại Server và không lộ khóa bí mật (API Key) xuống trình duyệt
B. Bắt buộc phải gọi qua trình duyệt của người dùng
C. Không hỗ trợ async/await trong Server Component
D. Luôn yêu cầu cài đặt thêm Redux Toolkit
Đáp án: A

Câu 2 (1.5 điểm): Chỉ mục (Index) dạng B-Tree trong hệ quản trị cơ sở dữ liệu PostgreSQL giúp tối ưu hóa thao tác nào hiệu quả nhất?
A. Truy vấn tìm kiếm theo khoảng (Range Query) và so sánh bằng (=, <, <=, >, >=)
B. Chỉ dùng để nén hình ảnh dung lượng lớn
C. Tự động xóa các bảng không sử dụng
*D. Cả A và các truy vấn sắp xếp ORDER BY trên cột được đánh chỉ mục

Câu 3 (2.0 điểm): Khi thiết kế RESTful API, mã trạng thái HTTP nào biểu thị lỗi vượt quá giới hạn tần suất gọi (Rate Limit / Too Many Requests)?
A. 401 Unauthorized   B. 403 Forbidden   C. 429 Too Many Requests   D. 502 Bad Gateway
Đáp án đúng: C

PHẦN II: CÂU HỎI TỰ LUẬN

Câu 4 (5.0 điểm): Hãy phân tích cơ chế hoạt động của tính năng Row Level Security (RLS) trong PostgreSQL / Supabase và viết ví dụ chính sách bảo mật để đảm bảo mỗi thí sinh chỉ có thể xem lịch sử bài thi của chính mình.`;

export default function ExamCreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reviewSectionRef = useRef<HTMLDivElement>(null);

  const [importerTab, setImporterTab] = useState<"file" | "clipboard">("file");
  const [clipboardText, setClipboardText] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [questionTypeOverride, setQuestionTypeOverride] = useState<"auto" | "multiple_choice" | "essay" | "mixed">("auto");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const [questions, setQuestions] = useState<ParsedQuestionDraft[]>([]);
  const [mcqScorePerQuestion, setMcqScorePerQuestion] = useState<number>(0.5);
  const [essayScorePerQuestion, setEssayScorePerQuestion] = useState<number>(2.0);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsedFileName, setParsedFileName] = useState("");
  const [parseMode, setParseMode] = useState<"ai" | "fallback" | null>(null);
  const [parseNotice, setParseNotice] = useState("");
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    setAiStatusMessage("");
    try {
      const res = await fetch("/api/ai/parse-exam", { method: "GET" });
      const data = await res.json();
      setAiConnected(Boolean(data?.connected));
      setAiStatusMessage(
        data?.message ||
          (data?.connected
            ? `Đã kết nối Gemini AI (${data?.model})`
            : "Chưa kết nối được Gemini AI (Đang dùng Fallback Regex).")
      );
    } catch {
      setAiConnected(false);
      setAiStatusMessage("Không thể kiểm tra kết nối AI lúc này.");
    } finally {
      setIsTestingAi(false);
    }
  };

  useEffect(() => {
    handleTestAiConnection();
    getCategories(true).then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }
    });
  }, []);

  const syncInitialScoreInputs = (drafts: ParsedQuestionDraft[]) => {
    const firstMcq = drafts.find((q) => q.type === "multiple_choice");
    const firstEssay = drafts.find((q) => q.type === "essay");
    if (firstMcq) setMcqScorePerQuestion(Number(firstMcq.max_score) || 0.5);
    if (firstEssay) setEssayScorePerQuestion(Number(firstEssay.max_score) || 2.0);
  };

  const scrollToPreviewSection = () => {
    setTimeout(() => {
      reviewSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
  };

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParseError("");
    setParseNotice("");
    setParsedFileName(file.name);

    try {
      const result = await parseExamFileWithAI(file);
      if (result.questions.length === 0) {
        throw new Error("Không thể bóc tách câu hỏi từ tệp tin này.");
      }
      setQuestions(result.questions);
      setParseMode(result.mode);
      setParseNotice(
        result.mode === "ai"
          ? `Đã bóc tách thông minh ${result.questions.length} câu hỏi từ "${file.name}" bằng Gemini AI.`
          : `Đã bóc tách ${result.questions.length} câu hỏi từ "${file.name}" bằng Bộ phân tích dự phòng (Fallback Parser).`
      );
      syncInitialScoreInputs(result.questions);

      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(`Đề thi: ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`);
      }
      scrollToPreviewSection();
    } catch (err: any) {
      setParseError(err?.message || "Đã xảy ra lỗi khi phân tích tệp.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseClipboard = async () => {
    if (!clipboardText.trim()) {
      setParseError("Vui lòng dán hoặc nhập nội dung văn bản đề thi vào ô bên dưới.");
      return;
    }

    setIsParsing(true);
    setParseError("");
    setParseNotice("");
    setParsedFileName("Văn bản từ Clipboard");

    try {
      const result = await parseExamTextWithAI(clipboardText);
      if (result.questions.length === 0) {
        throw new Error("Không tìm thấy câu hỏi hợp lệ trong đoạn văn bản đã dán.");
      }

      setQuestions(result.questions);
      setParseMode(result.mode);
      setParseNotice(
        result.mode === "ai"
          ? `Gemini AI đã phân tích và bóc tách thành công ${result.questions.length} câu hỏi từ văn bản Clipboard.`
          : `Đã bóc tách thành công ${result.questions.length} câu hỏi từ văn bản bằng Bộ phân tích Regex dự phòng.`
      );
      syncInitialScoreInputs(result.questions);

      if (!title) {
        const firstLine = clipboardText
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l.length > 5 && !/^(?:câu|question|phần|part|\d+)/i.test(l));
        setTitle(
          firstLine && firstLine.length <= 90
            ? firstLine
            : "Đề thi thử Nhập từ Văn bản / Clipboard"
        );
      }
      scrollToPreviewSection();
    } catch (err: any) {
      setParseError(err?.message || "Đã xảy ra lỗi khi bóc tách văn bản đề thi.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleQuickPasteFromNavigator = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setClipboardText(text);
          setParseError("");
        }
      }
    } catch {
      // Browser permission denied -> user can press Ctrl+V directly in the textarea
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const loadDemoQuestions = (type: "word" | "excel" | "pdf") => {
    setParseError("");
    let demoList: ParsedQuestionDraft[] = [];

    if (type === "word") {
      setParsedFileName("de_thi_lap_trinh_web.docx");
      setTitle("Đề thi thử Trắc nghiệm & Tự luận Chuyên ngành Web Modern");
      setDescription("Đánh giá toàn diện kiến trúc React Server Components, Database Caching và Web Vitals.");
      setDurationMinutes(40);
      demoList = [
        {
          id: `q_demo_1`,
          type: "multiple_choice",
          content: "Trong kiến trúc Next.js App Router, dữ liệu fetch() tại Server Component mặc định có hành vi nào?",
          options: [
            "A. Tự động được cache hoặc tái xác thực tùy theo cấu hình fetch cache",
            "B. Không thể thực hiện fetch() tại Server Component",
            "C. Bắt buộc phải thông qua Axios",
            "D. Luôn luôn chạy lại ở phía client sau khi hydration",
          ],
          correct_answer: "A",
          max_score: 2.5,
        },
        {
          id: `q_demo_2`,
          type: "multiple_choice",
          content: "Phương thức HTTP nào an toàn (Safe) và có tính lũy kế (Idempotent) theo chuẩn RFC 7231?",
          options: [
            "A. POST",
            "B. GET",
            "C. PATCH",
            "D. CONNECT",
          ],
          correct_answer: "B",
          max_score: 2.5,
        },
        {
          id: `q_demo_3`,
          type: "essay",
          content: "Hãy phân tích chi tiết cơ chế hoạt động của Connection Pooling trong PostgreSQL và lợi ích của Supabase Connection Pooler (PgBouncer) khi ứng dụng chịu tải 10,000 requests/giây.",
          options: [],
          correct_answer: "",
          max_score: 5.0,
        },
      ];
    } else if (type === "excel") {
      setParsedFileName("ngan_hang_cau_hoi_database.xlsx");
      setTitle("Ngân hàng Câu hỏi Hệ Quản trị Cơ sở Dữ liệu");
      setDescription("Trắc nghiệm SQL, Indexing B-Tree, Normalization và Transaction ACID.");
      setDurationMinutes(30);
      demoList = [
        {
          id: `q_demo_xl_1`,
          type: "multiple_choice",
          content: "Phép chuẩn hóa cơ sở dữ liệu 3NF yêu cầu loại bỏ sự phụ thuộc nào sau đây?",
          options: [
            "A. Phụ thuộc bắc cầu (Transitive dependency)",
            "B. Phụ thuộc một phần vào khóa chính",
            "C. Phụ thuộc đa trị (Multivalued dependency)",
            "D. Khóa ngoại tham chiếu",
          ],
          correct_answer: "A",
          max_score: 2.5,
        },
        {
          id: `q_demo_xl_2`,
          type: "multiple_choice",
          content: "Lệnh SQL nào dùng để giải phóng bộ nhớ và cập nhật thống kê cho query planner trong PostgreSQL?",
          options: [
            "A. TRUNCATE TABLE",
            "B. VACUUM ANALYZE",
            "C. OPTIMIZE QUERY",
            "D. REINDEX DATABASE",
          ],
          correct_answer: "B",
          max_score: 2.5,
        },
        {
          id: `q_demo_xl_3`,
          type: "essay",
          content: "Trình bày sự khác biệt giữa Deadlock và Livelock trong xử lý đồng thời, đồng thời nêu các phương pháp phát hiện hoặc phòng ngừa Deadlock trong hệ thống tài chính.",
          options: [],
          correct_answer: "",
          max_score: 5.0,
        },
      ];
    } else {
      setParsedFileName("de_thi_an_ninh_mang.pdf");
      setTitle("Đề thi thử An toàn Thông tin & Mật mã học Ứng dụng");
      setDescription("Kiểm tra kiến thức về mã hóa bất đối xứng RSA/ECC, JWT Authentication và tấn công CSRF/XSS.");
      setDurationMinutes(45);
      demoList = [
        {
          id: `q_demo_pdf_1`,
          type: "multiple_choice",
          content: "Thuật toán nào sau đây là thuật toán mã hóa công khai (Asymmetric Key Cryptography)?",
          options: [
            "A. RSA",
            "B. AES-256",
            "C. ChaCha20",
            "D. DES",
          ],
          correct_answer: "A",
          max_score: 2.5,
        },
        {
          id: `q_demo_pdf_2`,
          type: "multiple_choice",
          content: "Thuộc tính nào của Cookie giúp ngăn chặn JavaScript phía Client đánh cắp Session qua tấn công XSS?",
          options: [
            "A. Secure",
            "B. HttpOnly",
            "C. SameSite=Strict",
            "D. Path=/",
          ],
          correct_answer: "B",
          max_score: 2.5,
        },
        {
          id: `q_demo_pdf_3`,
          type: "essay",
          content: "Trình bày nguyên lý hoạt động của cơ chế bảo vệ CSRF Token và giải thích tại sao SameSite Cookie chưa đủ để thay thế hoàn toàn CSRF Token trong các hệ thống đa miền (Cross-Origin).",
          options: [],
          correct_answer: "",
          max_score: 5.0,
        },
      ];
    }

    setQuestions(demoList);
    setParseMode("ai");
    setParseNotice(`Đã nạp bộ đề mẫu (${demoList.length} câu hỏi). Hãy rà soát cấu trúc bên dưới và bấm "Xác nhận & Lưu đề".`);
    syncInitialScoreInputs(demoList);
    scrollToPreviewSection();
  };

  const handleBulkMcqScoreChange = (scorePerMcq: number) => {
    setMcqScorePerQuestion(scorePerMcq);
    setQuestions((prev) =>
      prev.map((q) =>
        q.type === "multiple_choice" ? { ...q, max_score: scorePerMcq } : q
      )
    );
  };

  const handleBulkEssayScoreChange = (scorePerEssay: number) => {
    setEssayScorePerQuestion(scorePerEssay);
    setQuestions((prev) =>
      prev.map((q) =>
        q.type === "essay" ? { ...q, max_score: scorePerEssay } : q
      )
    );
  };

  const handleApplyAutoScale = (
    desiredTotal: number,
    mode: "proportional" | "fix_essay_split_mcq"
  ): { newMcqScore: number; newEssayScore: number } => {
    const mcqs = questions.filter((q) => q.type === "multiple_choice");
    const essays = questions.filter((q) => q.type === "essay");
    const mCount = mcqs.length;
    const eCount = essays.length;

    if (mCount === 0 && eCount === 0) {
      return { newMcqScore: mcqScorePerQuestion, newEssayScore: essayScorePerQuestion };
    }

    if (mCount > 0 && eCount === 0) {
      const perMcq = Math.round((desiredTotal / mCount) * 100) / 100;
      setMcqScorePerQuestion(perMcq);
      setQuestions((prev) =>
        prev.map((q, idx) => {
          if (idx === prev.length - 1) {
            const sumOthers = perMcq * (mCount - 1);
            const lastScore = Math.max(
              0.01,
              Math.round((desiredTotal - sumOthers) * 100) / 100
            );
            return { ...q, max_score: lastScore };
          }
          return { ...q, max_score: perMcq };
        })
      );
      return { newMcqScore: perMcq, newEssayScore: essayScorePerQuestion };
    }

    if (eCount > 0 && mCount === 0) {
      const perEssay = Math.round((desiredTotal / eCount) * 100) / 100;
      setEssayScorePerQuestion(perEssay);
      setQuestions((prev) =>
        prev.map((q, idx) => {
          if (idx === prev.length - 1) {
            const sumOthers = perEssay * (eCount - 1);
            const lastScore = Math.max(
              0.01,
              Math.round((desiredTotal - sumOthers) * 100) / 100
            );
            return { ...q, max_score: lastScore };
          }
          return { ...q, max_score: perEssay };
        })
      );
      return { newMcqScore: mcqScorePerQuestion, newEssayScore: perEssay };
    }

    const currentEssaySum = essays.reduce((s, q) => s + Number(q.max_score || 0), 0);
    if (mode === "fix_essay_split_mcq" && currentEssaySum < desiredTotal) {
      const remainingForMcq = desiredTotal - currentEssaySum;
      const perMcq = Math.round((remainingForMcq / mCount) * 100) / 100;
      setMcqScorePerQuestion(perMcq);

      let mcqSeen = 0;
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.type !== "multiple_choice") return q;
          mcqSeen++;
          if (mcqSeen === mCount) {
            const sumOthers = perMcq * (mCount - 1);
            const lastScore = Math.max(
              0.01,
              Math.round((remainingForMcq - sumOthers) * 100) / 100
            );
            return { ...q, max_score: lastScore };
          }
          return { ...q, max_score: perMcq };
        })
      );
      return { newMcqScore: perMcq, newEssayScore: essayScorePerQuestion };
    }

    const currentTotal = questions.reduce((s, q) => s + Number(q.max_score || 0), 0);
    const ratio = currentTotal > 0 ? desiredTotal / currentTotal : 1;

    const scaledMcq = Math.max(0.05, Math.round(mcqScorePerQuestion * ratio * 100) / 100);
    const scaledEssay = Math.max(0.25, Math.round(essayScorePerQuestion * ratio * 100) / 100);
    setMcqScorePerQuestion(scaledMcq);
    setEssayScorePerQuestion(scaledEssay);

    setQuestions((prev) => {
      let runningSum = 0;
      return prev.map((q, idx) => {
        if (idx === prev.length - 1) {
          const remainder = Math.max(
            0.05,
            Math.round((desiredTotal - runningSum) * 100) / 100
          );
          return { ...q, max_score: remainder };
        }
        const rawBase =
          Number(q.max_score) > 0
            ? Number(q.max_score)
            : q.type === "multiple_choice"
            ? mcqScorePerQuestion
            : essayScorePerQuestion;
        const scaled = Math.max(0.05, Math.round(rawBase * ratio * 100) / 100);
        runningSum = Math.round((runningSum + scaled) * 100) / 100;
        return { ...q, max_score: scaled };
      });
    });

    return { newMcqScore: scaledMcq, newEssayScore: scaledEssay };
  };

  const handleAddQuestion = () => {
    const nextIdx = questions.length + 1;
    const newDraft: ParsedQuestionDraft = {
      id: `manual_${Date.now()}_${nextIdx}`,
      type: "multiple_choice",
      content: `Câu hỏi ${nextIdx}: `,
      options: [
        "A. Lựa chọn A",
        "B. Lựa chọn B",
        "C. Lựa chọn C",
        "D. Lựa chọn D",
      ],
      correct_answer: "A",
      max_score: mcqScorePerQuestion,
    };
    setQuestions([...questions, newDraft]);
  };

  const handleUpdateQuestion = (index: number, updated: ParsedQuestionDraft) => {
    const list = [...questions];
    list[index] = updated;
    setQuestions(list);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleConfirmAndPublish = async () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề cho đề thi.");
      return;
    }
    if (questions.length === 0) {
      alert("Đề thi cần có ít nhất 1 câu hỏi.");
      return;
    }

    const mcqs = questions.filter((q) => q.type === "multiple_choice");
    const essays = questions.filter((q) => q.type === "essay");
    const resolvedType =
      questionTypeOverride !== "auto"
        ? questionTypeOverride
        : mcqs.length > 0 && essays.length > 0
        ? "mixed"
        : essays.length > 0
        ? "essay"
        : "multiple_choice";

    const selectedCat = categories.find((c) => c.id === categoryId) || categories.find((c) => c.slug === "cnxh") || categories[0];
    const catId = selectedCat?.id || "cat_cnxh";
    const catSlug = selectedCat?.slug || "cnxh";

    setIsSaving(true);
    try {
      await createExam(
        {
          title: title.trim(),
          description: description.trim(),
          duration_minutes: Number(durationMinutes) || 45,
          status,
          category_id: catId,
          category_slug: catSlug,
          question_count: questions.length,
          question_type: resolvedType,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        },
        questions
      );

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      alert("Lỗi khi lưu đề thi: " + (err?.message || "Vui lòng thử lại"));
    } finally {
      setIsSaving(false);
    }
  };

  const mcqQuestions = questions.filter((q) => q.type === "multiple_choice");
  const essayQuestions = questions.filter((q) => q.type === "essay");
  const mcqCount = mcqQuestions.length;
  const essayCount = essayQuestions.length;
  const currentMcqTotal =
    Math.round(mcqQuestions.reduce((sum, q) => sum + Number(q.max_score || 0), 0) * 100) / 100;
  const currentEssayTotal =
    Math.round(essayQuestions.reduce((sum, q) => sum + Number(q.max_score || 0), 0) * 100) / 100;
  const totalScore = Math.round((currentMcqTotal + currentEssayTotal) * 100) / 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-indigo-400" />
          <span>Quay lại Bảng điều khiển Quản trị</span>
        </Link>
      </div>

      {/* Prominent Admin Top Bar Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-all shrink-0"
        >
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <span>Quản lý Đề thi</span>
        </Link>
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-all shrink-0"
        >
          <FolderTree className="h-4 w-4 text-slate-400" />
          <span>Quản lý Danh mục con</span>
        </Link>
        <Link
          href="/admin/create"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.35)] shrink-0"
        >
          <FilePlus2 className="h-4 w-4 text-white" />
          <span>Tạo Đề thi mới</span>
        </Link>
        <Link
          href="/admin/grading"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-all shrink-0"
        >
          <Target className="h-4 w-4 text-emerald-400" />
          <span>Phòng Chấm bài</span>
        </Link>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-all shrink-0"
        >
          <Settings className="h-4 w-4 text-amber-400" />
          <span>Cài đặt Hệ thống</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-[11px] font-medium text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Smart Exam Importer Engine • Gemini AI & Clipboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Tạo Đề thi thử & Bóc tách Thông minh
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Tải lên tệp Word (.docx), Excel (.xlsx), PDF hoặc dán trực tiếp văn bản từ Clipboard để Gemini AI tự động nhận diện câu hỏi, đáp án và điểm số.
          </p>
        </div>

        {questions.length > 0 && (
          <button
            type="button"
            onClick={handleConfirmAndPublish}
            disabled={isSaving}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 text-xs font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{isSaving ? "Đang lưu..." : "Xác nhận & Lưu đề"}</span>
          </button>
        )}
      </div>

      {/* 1. Smart Exam Importer Panel (Tab 1: File Upload | Tab 2: Paste from Clipboard) */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 mb-8 overflow-hidden rounded-2xl shadow-xl">
        {/* Importer Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/60 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-900/80 p-1 border border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setImporterTab("file");
                setParseError("");
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                importerTab === "file"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              <span>Tải tệp lên (Word / Excel / PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setImporterTab("clipboard");
                setParseError("");
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                importerTab === "clipboard"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <ClipboardPaste className="h-4 w-4" />
              <span>Dán từ Clipboard / Văn bản</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestAiConnection}
              disabled={isTestingAi}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition disabled:opacity-50"
              title="Kiểm tra xem Server có gọi được model Gemini AI thành công hay không"
            >
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isTestingAi ? "Đang ping AI..." : "Kiểm tra kết nối AI"}</span>
            </button>
          </div>
        </div>

        {aiStatusMessage && (
          <div
            className={`mx-6 mt-4 flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-xs ${
              aiConnected
                ? "border-emerald-800/50 bg-emerald-950/40 text-emerald-300"
                : "border-amber-800/50 bg-amber-950/40 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>{aiStatusMessage}</span>
            </div>
            <span className="font-semibold">
              {aiConnected ? "ONLINE" : "FALLBACK MODE"}
            </span>
          </div>
        )}

        {/* Tab Content */}
        {importerTab === "file" ? (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`p-6 text-center transition-colors sm:p-8 ${
              isDragging ? "bg-indigo-950/30" : ""
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,.xlsx,.xls,.pdf,.txt"
              onChange={onFileInputChange}
              className="hidden"
            />

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h3 className="text-base font-bold text-white">
              Kéo thả tệp đề thi hoặc nhấn để chọn tệp
            </h3>
            <p className="mx-auto mt-1 max-w-lg text-xs text-slate-400">
              Hỗ trợ định dạng Microsoft Word (.docx), Microsoft Excel (.xlsx), PDF và TXT. Hệ thống sẽ trích xuất văn bản và dùng Gemini AI để phân tích cấu trúc câu hỏi.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 text-xs font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition active:scale-[0.98] disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {isParsing
                    ? "Gemini AI đang bóc tách dữ liệu..."
                    : "Chọn tệp từ máy tính"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setImporterTab("clipboard")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 px-4 py-2.5 text-xs font-medium text-slate-300 transition"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                <span>Chuyển sang Dán từ Clipboard</span>
              </button>
            </div>

            {/* 1-Click Demo File Presets */}
            <div className="mt-6 border-t border-slate-800/80 pt-5">
              <span className="mb-2.5 block text-[11px] font-semibold text-slate-400">
                Hoặc thử nghiệm nhanh với dữ liệu mẫu chuẩn hóa:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => loadDemoQuestions("word")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
                >
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Nạp mẫu Word (.docx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadDemoQuestions("excel")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Nạp mẫu Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadDemoQuestions("pdf")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
                >
                  <FileCode className="h-3.5 w-3.5 text-amber-400" />
                  <span>Nạp mẫu PDF (.pdf)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ClipboardPaste className="h-4 w-4 text-indigo-400" />
                  <span>Dán nội dung đề thi từ Clipboard / Văn bản</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Sao chép toàn bộ nội dung đề thi từ Word, Notepad, Website, PDF hoặc Messenger rồi bấm <strong className="text-slate-200">Ctrl + V</strong> vào ô bên dưới.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickPasteFromNavigator}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
                  title="Đọc và dán trực tiếp từ bộ nhớ tạm (Clipboard)"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  <span>Dán nhanh</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setClipboardText(SAMPLE_CLIPBOARD_EXAM);
                    setParseError("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>Chèn đề mẫu thử nghiệm</span>
                </button>

                {clipboardText && (
                  <button
                    type="button"
                    onClick={() => setClipboardText("")}
                    className="inline-flex items-center gap-1 rounded-xl bg-rose-950/30 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-900/40 px-3 py-1.5 text-xs font-semibold transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa trắng</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={10}
              value={clipboardText}
              onChange={(e) => setClipboardText(e.target.value)}
              placeholder={`Dán (Ctrl+V) toàn bộ nội dung đề thi vào đây...\n\nVí dụ:\nCâu 1: Giao thức nào hoạt động ở tầng Transport trong mô hình OSI?\nA. HTTP   B. TCP   C. IP   D. ARP\nĐáp án: B\n\nCâu 2 (Tự luận - 3 điểm): Phân tích sự khác nhau giữa TCP và UDP...`}
              className="glass-input w-full rounded-xl p-4 font-mono text-xs leading-relaxed text-slate-100"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
              <p className="text-[11px] text-slate-400">
                Mẹo: Không cần trình bày đúng chuẩn A. B. C. D. — Gemini AI có thể tự động bóc tách cả câu hỏi trắc nghiệm lẫn tự luận trình bày tự do.
              </p>

              <button
                type="button"
                onClick={handleParseClipboard}
                disabled={isParsing || !clipboardText.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-6 py-2.5 text-xs font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition active:scale-[0.98] disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {isParsing
                    ? "Đang phân tích & bóc tách bằng AI..."
                    : "Bóc tách câu hỏi"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Error or Success Notice inside Importer Panel */}
        {parseError && (
          <div className="mx-6 mb-6 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-200">
            {parseError}
          </div>
        )}

        {parseNotice && !parseError && (
          <div className="mx-6 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-800/50 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{parseNotice}</span>
            </div>
            <span className="rounded-full bg-emerald-950/80 border border-emerald-700/50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
              {parseMode === "ai" ? "Gemini AI Smart Parser" : "Fallback Regex Parser"}
            </span>
          </div>
        )}
      </div>

      {/* 2. Exam Metadata Form */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 mb-8 rounded-2xl p-6">
        <h2 className="mb-4 text-base font-bold text-white">
          Thông tin cơ bản của Đề thi thử
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Tiêu đề đề thi <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đề thi thử Giữa kỳ: Kiến trúc Hệ thống Phân tán"
              className="glass-input h-10 w-full rounded-xl px-3.5 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Mô tả / Hướng dẫn làm bài
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về quy chế phòng thi, thời gian hoặc tài liệu cho phép..."
              className="glass-input w-full rounded-xl p-3 text-xs"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Danh mục con (Chuyên đề / Môn học) <span className="text-indigo-400">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="glass-input h-10 w-full rounded-xl px-3.5 text-sm"
            >
              <option value="" className="bg-slate-900 text-white">-- Chưa phân loại --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.icon || "📁"} {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Hình thức câu hỏi
            </label>
            <select
              value={questionTypeOverride}
              onChange={(e) => setQuestionTypeOverride(e.target.value as any)}
              className="glass-input h-10 w-full rounded-xl px-3.5 text-sm"
            >
              <option value="auto" className="bg-slate-900 text-white">
                Tự động nhận diện theo tệp / câu hỏi ({questions.length} câu)
              </option>
              <option value="multiple_choice" className="bg-slate-900 text-white">
                Trắc nghiệm khách quan
              </option>
              <option value="essay" className="bg-slate-900 text-white">
                Tự luận
              </option>
              <option value="mixed" className="bg-slate-900 text-white">
                Kết hợp Trắc nghiệm & Tự luận
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Thời gian làm bài (Phút)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
              className="glass-input h-10 w-full rounded-xl px-3.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Thời hạn / Hạn chót nộp bài (Tùy chọn)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="glass-input h-10 w-full rounded-xl px-3.5 text-sm [color-scheme:dark]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Trạng thái đề thi
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "published" | "draft")}
              className="glass-input h-10 w-full rounded-xl px-3.5 text-sm"
            >
              <option value="published" className="bg-slate-900 text-white">
                Xuất bản ngay (Thí sinh có thể thấy và thi)
              </option>
              <option value="draft" className="bg-slate-900 text-white">
                Lưu nháp (Chỉ quản trị viên thấy)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Score Configuration & Auto-Allocation Panel */}
      <div ref={reviewSectionRef}>
        {questions.length > 0 && (
          <div className="mb-8">
            <ScoreConfigPanel
              mcqCount={mcqCount}
              essayCount={essayCount}
              currentTotalScore={totalScore}
              currentMcqTotal={currentMcqTotal}
              currentEssayTotal={currentEssayTotal}
              initialMcqScore={mcqScorePerQuestion}
              initialEssayScore={essayScorePerQuestion}
              onChangeMcqScore={handleBulkMcqScoreChange}
              onChangeEssayScore={handleBulkEssayScoreChange}
              onApplyAutoScale={handleApplyAutoScale}
            />
          </div>
        )}
      </div>

      {/* 4. Questions Review & Editor Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              Rà soát & Chỉnh sửa Câu hỏi ({questions.length} câu)
            </h2>
            <p className="text-xs text-slate-400">
              {parsedFileName && `Nguồn: ${parsedFileName} • `}
              {mcqCount} trắc nghiệm ({currentMcqTotal}đ) • {essayCount} tự luận ({currentEssayTotal}đ) • Tổng {totalScore} điểm
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 px-3.5 py-2 text-xs font-semibold text-slate-300 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl py-12 text-center">
            <Layers className="mx-auto mb-2 h-8 w-8 text-indigo-400" />
            <p className="text-xs font-semibold text-slate-200">
              Chưa có câu hỏi nào trong danh sách
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Tải lên tệp Word, Excel, PDF, dán văn bản từ Clipboard phía trên hoặc nhấn &ldquo;Thêm câu hỏi mới&rdquo; để soạn trực tiếp.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <QuestionEditorCard
                key={q.id || idx}
                question={q}
                index={idx}
                total={questions.length}
                onChange={(updated) => handleUpdateQuestion(idx, updated)}
                onDelete={() => handleDeleteQuestion(idx)}
              />
            ))}

            {/* Bottom Add & Confirm Actions */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 flex flex-col items-center justify-between gap-4 rounded-2xl p-5 sm:flex-row">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 px-4 py-2 text-xs font-semibold text-slate-300 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm câu hỏi</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmAndPublish}
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-6 py-2.5 text-xs font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition active:scale-[0.98] disabled:opacity-50 sm:w-auto"
              >
                <Send className="h-4 w-4" />
                <span>
                  {isSaving
                    ? "Đang xử lý..."
                    : `Xác nhận & Lưu đề (Tổng ${totalScore}đ)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

