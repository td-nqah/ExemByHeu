"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseExamFileWithAI, parseExamTextWithAI } from "@/lib/parsers";
import { createExam, getCategories } from "@/lib/store";
import { ParsedQuestionDraft, Category } from "@/types/exam";
import { QuestionEditorCard } from "@/components/admin/QuestionEditorCard";
import { ScoreConfigPanel } from "@/components/admin/ScoreConfigPanel";
import { ExamStatusSelector } from "@/components/admin/ExamStatusSelector";
import { PopoverSelect } from "@/components/ui/PopoverSelect";
import { NumberStepper } from "@/components/ui/NumberStepper";
import {
  UploadCloud,
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
  Shuffle,
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

Câu 4 (5.0 điểm): Hãy phân tích cơ chế hoạt động của tính năng Row Level Security (RLS) trong PostgreSQL / Supabase và viết ví dụ chính sách bảo mật để đảm bảo mỗi user chỉ có thể xem lịch sử bài thi của chính mình.`;

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
  const [isShuffled, setIsShuffled] = useState(false);
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
      alert("Vui lòng nhập tiêu đề cho đề đánh giá.");
      return;
    }
    if (questions.length === 0) {
      alert("Đề đánh giá cần có ít nhất 1 câu hỏi.");
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
          is_shuffled: isShuffled,
        },
        questions
      );

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      alert("Lỗi khi lưu đề đánh giá: " + (err?.message || "Vui lòng thử lại"));
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


      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-[11px] font-medium text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Trợ lý học thuật AI • Trích xuất Đề đánh giá</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Tạo Đề đánh giá Học phần & Trích xuất Dữ liệu
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Tải lên tệp Word (.docx), Excel (.xlsx), PDF hoặc dán trực tiếp văn bản từ bộ nhớ tạm để Trợ lý học thuật AI tự động nhận diện câu hỏi, phương án và barem điểm.
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
            <span>{isSaving ? "Đang lưu..." : "Lưu & Ban hành đề đánh giá"}</span>
          </button>
        )}
      </div>

      {/* 1. Smart Exam Importer Panel (Tab 1: File Upload | Tab 2: Paste from Clipboard) */}
      <div className="obsidian-card mb-8 overflow-hidden rounded-2xl">
        {/* Importer Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 bg-indigo-950/40 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-indigo-950/40 p-1 border border-indigo-500/25">
            <button
              type="button"
              onClick={() => {
                setImporterTab("file");
                setParseError("");
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                importerTab === "file"
                  ? "bg-[#4f46e5] text-white shadow-[0_0_15px_rgba(79,70,229,0.35)]"
                  : "text-[#9ca3af] hover:bg-[#1f2937] hover:text-white"
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
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                importerTab === "clipboard"
                  ? "bg-[#4f46e5] text-white shadow-[0_0_15px_rgba(79,70,229,0.35)]"
                  : "text-[#9ca3af] hover:bg-[#1f2937] hover:text-white"
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b0f19] hover:bg-[#4f46e5] hover:text-white border border-[#1f2937] px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition disabled:opacity-50 cursor-pointer"
              title="Kiểm tra trạng thái kết nối mô hình Trợ lý AI"
            >
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isTestingAi ? "Đang kiểm tra AI..." : "Kiểm tra kết nối Trợ lý AI"}</span>
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
              {aiConnected ? "SẴN SÀNG" : "CHẾ ĐỘ DỰ PHÒNG"}
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
              Kéo thả tệp đề đánh giá hoặc nhấn để chọn tệp
            </h3>
            <p className="mx-auto mt-1 max-w-lg text-xs text-slate-400">
              Hỗ trợ định dạng Microsoft Word (.docx), Microsoft Excel (.xlsx), PDF và TXT. Hệ thống sẽ trích xuất văn bản và sử dụng Trợ lý học thuật AI để phân tích cấu trúc câu hỏi.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] hover:bg-[#6366f1] active:bg-[#4338ca] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_0_18px_rgba(79,70,229,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {isParsing
                    ? "Trợ lý AI đang trích xuất dữ liệu..."
                    : "Chọn tệp từ máy tính"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setImporterTab("clipboard")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b0f19] hover:bg-[#1f2937] hover:text-white border border-[#1f2937] px-4 py-2.5 text-xs font-medium text-slate-300 transition cursor-pointer"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                <span>Chuyển sang Dán từ bộ nhớ tạm</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ClipboardPaste className="h-4 w-4 text-indigo-400" />
                  <span>Dán nội dung đề đánh giá từ bộ nhớ tạm</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Sao chép toàn bộ nội dung đề đánh giá từ Word, Notepad, Website hoặc PDF rồi bấm <strong className="text-slate-200">Ctrl + V</strong> vào ô bên dưới.
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
                  <span>Chèn cấu trúc đề mẫu</span>
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
                Lưu ý nghiệp vụ: Trợ lý học thuật AI tự động phân tích và trích xuất cả câu hỏi trắc nghiệm lẫn tự luận định dạng tự do.
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
                    ? "Đang trích xuất câu hỏi bằng Trợ lý AI..."
                    : "Trích xuất câu hỏi"}
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
              {parseMode === "ai" ? "Trợ lý học thuật AI" : "Bộ phân tích dự phòng"}
            </span>
          </div>
        )}
      </div>

      {/* 2. Exam Metadata Form */}
      <div className="obsidian-card mb-8 rounded-2xl p-6">
        <h2 className="mb-4 text-base font-bold text-white">
          Thông tin cơ bản của Đề đánh giá
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Tiêu đề đề đánh giá <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đề đánh giá Học phần Giữa kỳ: Kiến trúc Hệ thống Phân tán"
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
              placeholder="Ghi chú về quy chế phòng thi, thời gian làm bài hoặc tài liệu được phép sử dụng..."
              className="glass-input w-full rounded-xl p-3 text-xs"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Học phần đào tạo <span className="text-indigo-400">*</span>
            </label>
            <PopoverSelect
              className="w-full"
              buttonClassName="w-full h-10"
              menuClassName="w-full"
              value={categoryId}
              onChange={(val) => setCategoryId(val)}
              placeholder="-- Chọn học phần đào tạo --"
              options={[
                { value: "", label: "-- Chưa phân loại --" },
                ...categories.map((c) => ({
                  value: c.id,
                  label: `${c.icon || "📁"} ${c.name}`,
                  description: `Mã: ${c.slug}`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Hình thức câu hỏi
            </label>
            <PopoverSelect<"auto" | "multiple_choice" | "essay" | "mixed">
              className="w-full"
              buttonClassName="w-full h-10"
              menuClassName="w-full"
              value={questionTypeOverride}
              onChange={(val) => setQuestionTypeOverride(val)}
              options={[
                {
                  value: "auto",
                  label: `Tự động nhận diện (${questions.length} câu)`,
                  description: "Tự động phân loại theo cấu trúc tệp tải lên",
                },
                {
                  value: "multiple_choice",
                  label: "Trắc nghiệm khách quan",
                },
                {
                  value: "essay",
                  label: "Tự luận",
                },
                {
                  value: "mixed",
                  label: "Kết hợp Trắc nghiệm & Tự luận",
                },
              ]}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Thời gian làm bài (Phút)
            </label>
            <NumberStepper
              value={durationMinutes}
              onChange={setDurationMinutes}
              min={5}
              max={300}
              step={5}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Thời hạn đóng ca thi (Tùy chọn)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="glass-input h-10 w-full rounded-xl px-3.5 text-sm [color-scheme:dark]"
            />
          </div>

          <div className="sm:col-span-2">
            <ExamStatusSelector
              value={status}
              onChange={setStatus}
              defaultViewMode="cards"
            />
          </div>

          {/* Toggle Switch: Shuffle Exam */}
          <div className="sm:col-span-2 rounded-xl bg-slate-900/60 border border-white/10 p-4 transition-all duration-200 hover:border-[#5852d6]/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all ${
                    isShuffled
                      ? "border-[#5852d6]/50 bg-[#5852d6]/20 text-indigo-400 shadow-[0_0_12px_rgba(88,82,214,0.3)]"
                      : "border-slate-800 bg-slate-800/60 text-slate-400"
                  }`}
                >
                  <Shuffle className="h-4 w-4" />
                </div>
                <div>
                  <label
                    htmlFor="shuffle-toggle-create"
                    className="text-sm font-semibold text-white flex items-center gap-2 cursor-pointer"
                  >
                    <span>Trộn ngẫu nhiên câu hỏi & đáp án</span>
                    {isShuffled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5852d6]/25 text-indigo-300 border border-[#5852d6]/40 font-mono">
                        BẬT (ACTIVE)
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tự động xáo trộn vị trí câu hỏi và các phương án A, B, C, D cho từng lượt đánh giá.
                  </p>
                </div>
              </div>

              {/* Custom Switch */}
              <button
                type="button"
                id="shuffle-toggle-create"
                role="switch"
                aria-checked={isShuffled}
                onClick={() => setIsShuffled(!isShuffled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#5852d6]/50 ${
                  isShuffled
                    ? "border-indigo-400 bg-[#5852d6] shadow-[0_0_14px_rgba(88,82,214,0.5)]"
                    : "border-slate-700 bg-slate-800"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isShuffled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
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
          <div className="obsidian-card rounded-2xl py-12 text-center">
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
            <div className="obsidian-card flex flex-col items-center justify-between gap-4 rounded-2xl p-5 sm:flex-row">
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
                    : `Lưu & Ban hành đề đánh giá (${totalScore}đ)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

