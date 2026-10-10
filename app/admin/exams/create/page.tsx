"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseExamFile } from "@/lib/parsers";
import { createExam } from "@/lib/store";
import { ParsedQuestionDraft, QuestionType } from "@/types/exam";
import { QuestionEditorCard } from "@/components/admin/QuestionEditorCard";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Layers,
  Clock,
} from "lucide-react";

export default function ExamCreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [status, setStatus] = useState<"published" | "draft">("published");

  // Parser & Questions state
  const [questions, setQuestions] = useState<ParsedQuestionDraft[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsedFileName, setParsedFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Handle File Upload & Parse
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

      // Auto-populate title if empty
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

  // Demo file presets for instant reviewer testing
  const loadDemoQuestions = (type: "word" | "excel" | "pdf") => {
    setParseError("");
    if (type === "word") {
      setParsedFileName("de_thi_lap_trinh_web.docx");
      setTitle("Đề thi Trắc nghiệm & Tự luận Chuyên ngành Web Modern");
      setDescription("Đánh giá toàn diện kiến trúc React Server Components, Database Caching và Web Vitals.");
      setDurationMinutes(40);
      setQuestions([
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
          max_score: 2.0,
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
          max_score: 2.0,
        },
        {
          id: `q_demo_3`,
          type: "essay",
          content: "Hãy phân tích chi tiết cơ chế hoạt động của Connection Pooling trong PostgreSQL và lợi ích của Supabase Connection Pooler (PgBouncer) khi ứng dụng chịu tải 10,000 requests/giây.",
          options: [],
          correct_answer: "",
          max_score: 6.0,
        },
      ]);
    } else if (type === "excel") {
      setParsedFileName("ngan_hang_cau_hoi_database.xlsx");
      setTitle("Ngân hàng Câu hỏi Hệ Quản trị Cơ sở Dữ liệu");
      setDescription("Trắc nghiệm SQL, Indexing B-Tree, Normalization và Transaction ACID.");
      setDurationMinutes(30);
      setQuestions([
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
      ]);
    } else {
      setParsedFileName("de_thi_an_ninh_mang.pdf");
      setTitle("Đề thi An toàn Thông tin & Mật mã học Ứng dụng");
      setDescription("Kiểm tra kiến thức về mã hóa bất đối xứng RSA/ECC, JWT Authentication và tấn công CSRF/XSS.");
      setDurationMinutes(45);
      setQuestions([
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
          max_score: 3.0,
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
          max_score: 3.0,
        },
        {
          id: `q_demo_pdf_3`,
          type: "essay",
          content: "Trình bày nguyên lý hoạt động của cơ chế bảo vệ CSRF Token và giải thích tại sao SameSite Cookie chưa đủ để thay thế hoàn toàn CSRF Token trong các hệ thống đa miền (Cross-Origin).",
          options: [],
          correct_answer: "",
          max_score: 4.0,
        },
      ]);
    }
  };

  // Add a blank question manually
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
      max_score: 2.0,
    };
    setQuestions([...questions, newDraft]);
  };

  // Update a question in place
  const handleUpdateQuestion = (index: number, updated: ParsedQuestionDraft) => {
    const list = [...questions];
    list[index] = updated;
    setQuestions(list);
  };

  // Delete a question
  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  // Submit and Publish Exam
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

  const mcqCount = questions.filter((q) => q.type === "multiple_choice").length;
  const essayCount = questions.filter((q) => q.type === "essay").length;
  const totalScore = questions.reduce((sum, q) => sum + Number(q.max_score || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Bảng điều khiển Quản trị</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
            Tạo Đề thi & Bóc tách Tệp tin
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Hỗ trợ nhập trực tiếp từ tài liệu Word (.docx), Excel (.xlsx), hoặc PDF với công cụ phân tích tự động.
          </p>
        </div>

        {questions.length > 0 && (
          <button
            type="button"
            onClick={handleConfirmAndPublish}
            disabled={isSaving}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Send className="h-4 w-4" />
            <span>{isSaving ? "Đang lưu..." : "Xác nhận & Xuất bản đề thi"}</span>
          </button>
        )}
      </div>

      {/* 1. File Upload Dropzone */}
      <div className="mb-8 rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-6 sm:p-8 text-center transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc,.xlsx,.xls,.pdf,.txt"
          onChange={onFileInputChange}
          className="hidden"
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 mb-4 shadow-xs">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Kéo thả tệp đề thi hoặc nhấn để chọn tệp
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Hỗ trợ định dạng Microsoft Word (.docx), Microsoft Excel (.xlsx), và tài liệu PDF.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isParsing ? "Đang bóc tách dữ liệu..." : "Chọn tệp từ máy tính"}
          </button>
        </div>

        {/* 1-Click Demo File Presets */}
        <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
            Hoặc thử nghiệm nhanh với dữ liệu mẫu chuẩn hóa:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => loadDemoQuestions("word")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Nạp mẫu Word (.docx)</span>
            </button>

            <button
              type="button"
              onClick={() => loadDemoQuestions("excel")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Nạp mẫu Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => loadDemoQuestions("pdf")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <FileCode className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <span>Nạp mẫu PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {parseError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {parseError}
          </div>
        )}
      </div>

      {/* 2. Exam Metadata Form */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Thông tin cơ bản của Kỳ thi
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Tiêu đề đề thi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra giữa kỳ - Kiến trúc Hệ thống Phân tán"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Mô tả / Hướng dẫn làm bài
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về quy chế phòng thi, thời gian hoặc tài liệu cho phép..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Thời gian làm bài (Phút)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Trạng thái đề thi
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "published" | "draft")}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
            >
              <option value="published">Xuất bản ngay (Thí sinh có thể thấy và thi)</option>
              <option value="draft">Lưu nháp (Chỉ quản trị viên thấy)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Interactive Preview & Edit Mode before Saving */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Xem trước & Chỉnh sửa Câu hỏi ({questions.length} câu)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {parsedFileName && `Dữ liệu từ: ${parsedFileName} • `}
              {mcqCount} trắc nghiệm • {essayCount} tự luận • Tổng {totalScore} điểm
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <Layers className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Chưa có câu hỏi nào trong danh sách
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Tải lên tệp Word, Excel, PDF phía trên hoặc nhấn "Thêm câu hỏi mới" để soạn trực tiếp.
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm câu hỏi</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAndPublish}
                disabled={isSaving}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Send className="h-4 w-4" />
                <span>{isSaving ? "Đang xử lý..." : "Xác nhận & Xuất bản đề thi"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
