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
} from "lucide-react";

export default function ExamCreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [status, setStatus] = useState<"published" | "draft">("published");

  const [questions, setQuestions] = useState<ParsedQuestionDraft[]>([]);
  const [mcqScorePerQuestion, setMcqScorePerQuestion] = useState<number>(0.5);
  const [essayScorePerQuestion, setEssayScorePerQuestion] = useState<number>(2.0);
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-indigo-400" />
          <span>Quay lại Bảng điều khiển Quản trị</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Tạo Đề thi thử & Bóc tách Tệp tin
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Hỗ trợ nhập trực tiếp từ tài liệu Word (.docx), Excel (.xlsx), hoặc PDF với cấu hình phân bổ điểm số tự động.
          </p>
        </div>

        {questions.length > 0 && (
          <button
            type="button"
            onClick={handleConfirmAndPublish}
            disabled={isSaving}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
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

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="text-base font-bold text-white">
          Kéo thả tệp đề thi hoặc nhấn để chọn tệp
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
          Hỗ trợ định dạng Microsoft Word (.docx), Microsoft Excel (.xlsx), và tài liệu PDF.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
          >
            {isParsing ? "Đang bóc tách dữ liệu..." : "Chọn tệp từ máy tính"}
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Nạp mẫu Word (.docx)</span>
            </button>

            <button
              type="button"
              onClick={() => loadDemoQuestions("excel")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Nạp mẫu Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => loadDemoQuestions("pdf")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <FileCode className="h-3.5 w-3.5 text-amber-400" />
              <span>Nạp mẫu PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {parseError && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200">
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

      {/* 4. Questions Editor (Always in Edit Mode when creating/adding an exam) */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              Chỉnh sửa Cấu trúc Câu hỏi ({questions.length} câu)
            </h2>
            <p className="text-xs text-slate-400">
              {parsedFileName && `Dữ liệu từ: ${parsedFileName} • `}
              {mcqCount} trắc nghiệm ({currentMcqTotal}đ) • {essayCount} tự luận ({currentEssayTotal}đ) • Tổng {totalScore} điểm
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-400" />
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="glass-card rounded-2xl py-12 text-center">
            <Layers className="mx-auto mb-2 h-8 w-8 text-indigo-400" />
            <p className="text-xs font-semibold text-slate-200">
              Chưa có câu hỏi nào trong danh sách
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Tải lên tệp Word, Excel, PDF phía trên hoặc nhấn &ldquo;Thêm câu hỏi mới&rdquo; để soạn trực tiếp.
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
            <div className="glass-panel flex flex-col items-center justify-between gap-4 rounded-2xl p-5 sm:flex-row">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  <Plus className="h-4 w-4 text-indigo-400" />
                  <span>Thêm câu hỏi</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirmAndPublish}
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition active:scale-[0.98] disabled:opacity-50 sm:w-auto"
              >
                <Send className="h-4 w-4" />
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
