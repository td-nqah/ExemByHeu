"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseExamFile } from "@/lib/parsers";
import { createExam } from "@/lib/store";
import { ParsedQuestionDraft } from "@/types/exam";
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
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  HelpCircle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export default function ExamCreatePage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [status, setStatus] = useState<"published" | "draft">("published");

  const [questions, setQuestions] = useState<ParsedQuestionDraft[]>([]);
  const [mcqScorePerQuestion, setMcqScorePerQuestion] = useState<number>(0.5);
  const [essayScorePerQuestion, setEssayScorePerQuestion] = useState<number>(2.0);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsedFileName, setParsedFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const syncInitialScoreInputs = (drafts: ParsedQuestionDraft[]) => {
    const firstMcq = drafts.find((q) => q.type === "multiple_choice");
    const firstEssay = drafts.find((q) => q.type === "essay");
    if (firstMcq) setMcqScorePerQuestion(Number(firstMcq.max_score) || 0.5);
    if (firstEssay) setEssayScorePerQuestion(Number(firstEssay.max_score) || 2.0);
  };

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParseError("");
    setParsedFileName(file.name);

    try {
      const parsedDrafts = await parseExamFile(file);
      if (parsedDrafts.length === 0) {
        throw new Error("Không thể bóc tách câu hỏi từ tệp tin này.");
      }
      setQuestions(parsedDrafts);
      syncInitialScoreInputs(parsedDrafts);
      setViewMode("preview");

      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(`Đề thi: ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`);
      }
    } catch (err: any) {
      setParseError(err?.message || "Đã xảy ra lỗi khi phân tích tệp.");
    } finally {
      setIsParsing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    syncInitialScoreInputs(demoList);
    setViewMode("preview");
  };

  // Bulk update all Multiple Choice questions when Admin changes "Điểm mỗi câu trắc nghiệm"
  const handleBulkMcqScoreChange = (scorePerMcq: number) => {
    setMcqScorePerQuestion(scorePerMcq);
    setQuestions((prev) =>
      prev.map((q) =>
        q.type === "multiple_choice" ? { ...q, max_score: scorePerMcq } : q
      )
    );
  };

  // Bulk update all Essay questions when Admin changes "Điểm mỗi câu tự luận"
  const handleBulkEssayScoreChange = (scorePerEssay: number) => {
    setEssayScorePerQuestion(scorePerEssay);
    setQuestions((prev) =>
      prev.map((q) =>
        q.type === "essay" ? { ...q, max_score: scorePerEssay } : q
      )
    );
  };

  // Auto-Calculate / Scale Score to Desired Total Score
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

    // Case 1: Only MCQ questions
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

    // Case 2: Only Essay questions
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

    // Case 3: Both MCQ and Essay exist
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

    // Default Proportional Scaling across all questions
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
    setViewMode("edit");
  };

  const handleUpdateQuestion = (index: number, updated: ParsedQuestionDraft) => {
    const list = [...questions];
    list[index] = updated;
    setQuestions(list);
  };

  const handleManualScoreOverride = (index: number, rawVal: string) => {
    const parsed = parseFloat(rawVal);
    const cleanScore = !isNaN(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : 0;
    const list = [...questions];
    list[index] = {
      ...list[index],
      max_score: cleanScore,
    };
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

    setIsSaving(true);
    try {
      await createExam(
        {
          title: title.trim(),
          description: description.trim(),
          duration_minutes: Number(durationMinutes) || 45,
          status,
        },
        questions
      );

      router.push("/admin/dashboard");
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
      <div className="mb-6">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white" />
          <span>Quay lại Bảng điều khiển Quản trị</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Tạo Đề thi thử & Bóc tách Tệp tin
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Hỗ trợ nhập trực tiếp từ tài liệu Word (.docx), Excel (.xlsx), hoặc PDF với cấu hình phân bổ điểm số tự động.
          </p>
        </div>

        {questions.length > 0 && (
          <button
            type="button"
            onClick={handleConfirmAndPublish}
            disabled={isSaving}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/40 bg-white px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-[0_8px_24px_rgba(255,255,255,0.14)] transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="h-4 w-4 text-zinc-950" />
            <span>{isSaving ? "Đang lưu..." : "Xác nhận & Tải đề lên"}</span>
          </button>
        )}
      </div>

      {/* 1. File Upload Dropzone */}
      <div className="glass-panel mb-8 rounded-2xl p-6 text-center sm:p-8">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc,.xlsx,.xls,.pdf,.txt"
          onChange={onFileInputChange}
          className="hidden"
        />

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white">
          <UploadCloud className="h-7 w-7 text-white" />
        </div>

        <h3 className="text-base font-bold text-white">
          Kéo thả tệp đề thi hoặc nhấn để chọn tệp
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-zinc-400">
          Hỗ trợ định dạng Microsoft Word (.docx), Microsoft Excel (.xlsx), và tài liệu PDF.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="rounded-xl border border-white/40 bg-white px-4 py-2 text-xs font-bold text-zinc-950 shadow-[0_8px_24px_rgba(255,255,255,0.14)] transition hover:bg-zinc-200 active:scale-[0.98]"
          >
            {isParsing ? "Đang bóc tách dữ liệu..." : "Chọn tệp từ máy tính"}
          </button>
        </div>

        {/* 1-Click Demo File Presets */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <span className="mb-2.5 block text-[11px] font-semibold text-zinc-400">
            Hoặc thử nghiệm nhanh với dữ liệu mẫu chuẩn hóa:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => loadDemoQuestions("word")}
              className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              <FileText className="h-3.5 w-3.5 text-white" />
              <span>Nạp mẫu Word (.docx)</span>
            </button>

            <button
              type="button"
              onClick={() => loadDemoQuestions("excel")}
              className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-white" />
              <span>Nạp mẫu Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => loadDemoQuestions("pdf")}
              className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
            >
              <FileCode className="h-3.5 w-3.5 text-white" />
              <span>Nạp mẫu PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {parseError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">
            {parseError}
          </div>
        )}
      </div>

      {/* 2. Exam Metadata Form */}
      <div className="glass-card mb-8 rounded-2xl p-6">
        <h2 className="mb-4 text-base font-bold text-white">
          Thông tin cơ bản của Đề thi thử
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              Tiêu đề đề thi <span className="text-red-400">*</span>
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
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
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
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
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
            <label className="mb-1.5 block text-xs font-medium text-zinc-300">
              Trạng thái đề thi
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "published" | "draft")}
              className="glass-input h-10 w-full rounded-xl px-3.5 text-sm"
            >
              <option value="published" className="bg-zinc-900 text-white">
                Xuất bản ngay (Thí sinh có thể thấy và thi)
              </option>
              <option value="draft" className="bg-zinc-900 text-white">
                Lưu nháp (Chỉ quản trị viên thấy)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Score Configuration & Auto-Allocation Panel */}
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

      {/* 4. Interactive Preview Mode & Edit Mode before Saving */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              {viewMode === "preview"
                ? `Chế độ Xem trước Đề thi (${questions.length} câu)`
                : `Chỉnh sửa Cấu trúc Câu hỏi (${questions.length} câu)`}
            </h2>
            <p className="text-xs text-zinc-400">
              {parsedFileName && `Dữ liệu từ: ${parsedFileName} • `}
              {mcqCount} trắc nghiệm ({currentMcqTotal}đ) • {essayCount} tự luận ({currentEssayTotal}đ) • Tổng {totalScore} điểm
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {questions.length > 0 && (
              <div className="inline-flex rounded-xl border border-white/10 bg-zinc-950/70 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "preview"
                      ? "bg-white text-zinc-950"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Chế độ Xem trước</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "edit"
                      ? "bg-white text-zinc-950"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Chỉnh sửa câu hỏi</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddQuestion}
              className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-white/10"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="glass-card rounded-2xl py-12 text-center">
            <Layers className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
            <p className="text-xs font-semibold text-zinc-200">
              Chưa có câu hỏi nào trong danh sách
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Tải lên tệp Word, Excel, PDF phía trên hoặc nhấn &ldquo;Thêm câu hỏi mới&rdquo; để soạn trực tiếp.
            </p>
          </div>
        ) : viewMode === "preview" ? (
          /* Clean Read-Only Preview Mode with Per-Question Score Override */
          <div className="space-y-4">
            <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-white" />
                <span>
                  <strong className="text-white">Chế độ Xem trước:</strong> Kiểm tra toàn bộ câu hỏi và đáp án chuẩn. Bạn có thể ghi đè điểm số riêng cho từng câu ngay tại góc phải mỗi thẻ câu hỏi.
                </span>
              </div>
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-zinc-200">
                <Clock className="h-3.5 w-3.5 text-white" />
                Thời lượng: {durationMinutes} phút
              </span>
            </div>

            {questions.map((q, idx) => {
              const isMCQ = q.type === "multiple_choice";

              return (
                <motion.article
                  key={q.id || idx}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.25) }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-xs font-bold text-white">
                        {idx + 1}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white">
                        {isMCQ ? (
                          <>
                            <HelpCircle className="h-3.5 w-3.5 text-white" />
                            <span>Câu hỏi Trắc nghiệm</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-3.5 w-3.5 text-white" />
                            <span>Câu hỏi Tự luận</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Individual Question Manual Score Override */}
                      <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-zinc-950/75 px-2.5 py-1">
                        <span className="text-[11px] font-medium text-zinc-400">
                          Điểm câu này:
                        </span>
                        <input
                          type="number"
                          min="0.05"
                          step="0.25"
                          value={q.max_score}
                          onChange={(e) =>
                            handleManualScoreOverride(idx, e.target.value)
                          }
                          className="h-6 w-16 rounded-md border border-white/15 bg-zinc-900 px-1.5 text-center text-xs font-bold text-white focus:border-white focus:outline-none"
                          title="Ghi đè điểm thủ công cho riêng câu hỏi này"
                        />
                        <span className="text-[11px] font-semibold text-zinc-300">
                          đ
                        </span>
                      </div>

                      {isMCQ && q.correct_answer && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          Đáp án đúng: {q.correct_answer}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mb-5 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-100">
                    {q.content}
                  </p>

                  {isMCQ ? (
                    <div className="space-y-2.5">
                      {q.options.map((optText, optIdx) => {
                        const letterMatch = optText.match(/^([A-Z])[\.\:\)]/i);
                        const letter = letterMatch
                          ? letterMatch[1].toUpperCase()
                          : String.fromCharCode(65 + optIdx);
                        const isCorrect =
                          (q.correct_answer || "").trim().toUpperCase() === letter;

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs transition ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-950/40 text-emerald-400 font-semibold shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]"
                                : "border-white/10 bg-zinc-950/55 text-zinc-300"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  isCorrect
                                    ? "border border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                                    : "border border-white/15 bg-zinc-900 text-zinc-300"
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="pt-0.5 leading-relaxed">{optText}</span>
                            </div>

                            {isCorrect && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                <span>Đáp án chuẩn</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/15 bg-zinc-950/50 p-4 text-xs text-zinc-400">
                      Câu hỏi tự luận (Điểm tối đa: {q.max_score} điểm). Thí sinh sẽ trình bày lập luận trực tiếp tại khung soạn thảo khi làm bài.
                    </div>
                  )}
                </motion.article>
              );
            })}

            {/* Bottom Review Actions: Back to Edit or Confirm & Publish */}
            <div className="glass-panel flex flex-col items-center justify-between gap-4 rounded-2xl p-5 sm:flex-row">
              <button
                type="button"
                onClick={() => setViewMode("edit")}
                className="glass-pill inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Edit3 className="h-4 w-4 text-white" />
                <span>Quay lại Chỉnh sửa</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAndPublish}
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-white px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-[0_8px_24px_rgba(255,255,255,0.14)] transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
              >
                <Send className="h-4 w-4 text-zinc-950" />
                <span>
                  {isSaving
                    ? "Đang xử lý..."
                    : `Xác nhận & Tải đề lên (Tổng ${totalScore}đ)`}
                </span>
              </button>
            </div>
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

            {/* Bottom Add, Preview & Confirm Actions */}
            <div className="glass-panel flex flex-col items-center justify-between gap-4 rounded-2xl p-5 sm:flex-row">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 text-white" />
                  <span>Thêm câu hỏi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                >
                  <Eye className="h-4 w-4 text-white" />
                  <span>Xem trước toàn bộ đề</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmAndPublish}
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-white px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-[0_8px_24px_rgba(255,255,255,0.14)] transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
              >
                <Send className="h-4 w-4 text-zinc-950" />
                <span>
                  {isSaving
                    ? "Đang xử lý..."
                    : `Xác nhận & Tải đề lên (Tổng ${totalScore}đ)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
