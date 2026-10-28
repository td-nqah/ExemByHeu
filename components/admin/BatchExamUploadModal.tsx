"use client";

import { useState, useRef, useMemo } from "react";
import { Category, ParsedQuestionDraft } from "@/types/exam";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Clock,
  Trash2,
  Eye,
  Check,
  ChevronRight,
  Layers,
  ArrowLeft,
  Folder,
  Save,
  HelpCircle,
  RefreshCw,
  Plus,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PopoverSelect } from "@/components/ui/PopoverSelect";

export interface ParsedBatchExam {
  tempId: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  hasIssues: boolean;
  issuesCount: number;
  questions: ParsedQuestionDraft[];
  categoryId?: string;
}

interface BatchExamUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
}

export function BatchExamUploadModal({
  isOpen,
  onClose,
  categories,
  onSuccess,
}: BatchExamUploadModalProps) {
  // Stepper: 1 = Upload, 2 = Splitting/Extracting, 3 = Review Table, 4 = Saving/Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // File & Config States
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || "cat_cnxh"
  );
  const [defaultDuration, setDefaultDuration] = useState<number>(45);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Progress States (Step 2)
  const [progressPercent, setProgressPercent] = useState<number>(10);
  const [progressStatus, setProgressStatus] = useState<string>(
    "Đang đọc cấu trúc tệp Word (.docx)..."
  );

  // Parsed Data States (Step 3)
  const [parsedExams, setParsedExams] = useState<ParsedBatchExam[]>([]);
  const [activeDrawerExam, setActiveDrawerExam] = useState<ParsedBatchExam | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Saving States (Step 4)
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const resetState = () => {
    setStep(1);
    setFile(null);
    setProgressPercent(10);
    setProgressStatus("");
    setParsedExams([]);
    setActiveDrawerExam(null);
    setSearchFilter("");
    setIsSaving(false);
    setSavedCount(0);
    setErrorMessage("");
  };

  const handleModalClose = () => {
    if (step === 2 || isSaving) {
      if (!window.confirm("Quá trình xử lý đang diễn ra. Bạn có chắc muốn hủy bỏ?")) {
        return;
      }
    }
    resetState();
    onClose();
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      validateAndSetFile(dropped);
    }
  };

  const validateAndSetFile = (selected: File) => {
    if (!selected.name.toLowerCase().endsWith(".docx")) {
      alert("Hệ thống chỉ hỗ trợ tệp định dạng Microsoft Word (.docx).");
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      alert("Kích thước tệp vượt quá 50MB. Vui lòng chọn tệp nhỏ hơn.");
      return;
    }
    setFile(selected);
    setErrorMessage("");
  };

  // Start Extraction Pipeline
  const handleStartExtraction = async () => {
    if (!file) return;

    setStep(2);
    setProgressPercent(20);
    setProgressStatus("Đang đọc nội dung văn bản qua Mammoth Engine...");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("defaultCategoryId", selectedCategoryId);
      formData.append("defaultDuration", String(defaultDuration));

      // Simulate step progression for smooth UX
      const timer1 = setTimeout(() => {
        setProgressPercent(45);
        setProgressStatus("Đang nhận diện các mã đề và tách văn bản thành các đề thi độc lập...");
      }, 1200);

      const timer2 = setTimeout(() => {
        setProgressPercent(75);
        setProgressStatus("Trợ lý Gemini 2.5 Flash đang phân tích cấu trúc từng đề thi song song...");
      }, 3000);

      const res = await fetch("/api/admin/exams/batch-split", {
        method: "POST",
        body: formData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể phân tích tệp nhiều đề thi.");
      }

      setProgressPercent(100);
      setProgressStatus(`Đã bóc tách thành công ${data.totalExams} đề thi!`);

      // Attach category to all parsed exams
      const enrichedExams: ParsedBatchExam[] = (data.exams || []).map((e: any) => ({
        ...e,
        categoryId: selectedCategoryId,
      }));

      setTimeout(() => {
        setParsedExams(enrichedExams);
        setStep(3);
      }, 600);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Đã xảy ra lỗi trong quá trình phân tích.");
      setStep(1);
    }
  };

  // Handle Editing Exam Title & Duration inline
  const handleUpdateExamTitle = (tempId: string, newTitle: string) => {
    setParsedExams((prev) =>
      prev.map((e) => (e.tempId === tempId ? { ...e, title: newTitle } : e))
    );
  };

  const handleUpdateExamDuration = (tempId: string, duration: number) => {
    setParsedExams((prev) =>
      prev.map((e) =>
        e.tempId === tempId ? { ...e, durationMinutes: Math.max(5, duration) } : e
      )
    );
  };

  const handleDeleteExam = (tempId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn bỏ đề thi này khỏi danh sách tải lên?")) {
      setParsedExams((prev) => prev.filter((e) => e.tempId !== tempId));
      if (activeDrawerExam?.tempId === tempId) {
        setActiveDrawerExam(null);
      }
    }
  };

  // Question editing within active drawer
  const handleUpdateDrawerQuestion = (
    qId: string,
    field: keyof ParsedQuestionDraft,
    value: any
  ) => {
    if (!activeDrawerExam) return;

    const updatedQuestions = activeDrawerExam.questions.map((q) => {
      if (q.id === qId) {
        return { ...q, [field]: value };
      }
      return q;
    });

    const issuesCount = updatedQuestions.filter(
      (q) => q.type === "multiple_choice" && !q.correct_answer
    ).length;

    const updatedExam: ParsedBatchExam = {
      ...activeDrawerExam,
      questions: updatedQuestions,
      questionCount: updatedQuestions.length,
      hasIssues: issuesCount > 0,
      issuesCount,
    };

    setActiveDrawerExam(updatedExam);
    setParsedExams((prev) =>
      prev.map((e) => (e.tempId === updatedExam.tempId ? updatedExam : e))
    );
  };

  const handleDeleteDrawerQuestion = (qId: string) => {
    if (!activeDrawerExam) return;

    const updatedQuestions = activeDrawerExam.questions.filter((q) => q.id !== qId);
    const issuesCount = updatedQuestions.filter(
      (q) => q.type === "multiple_choice" && !q.correct_answer
    ).length;

    const updatedExam: ParsedBatchExam = {
      ...activeDrawerExam,
      questions: updatedQuestions,
      questionCount: updatedQuestions.length,
      hasIssues: issuesCount > 0,
      issuesCount,
    };

    setActiveDrawerExam(updatedExam);
    setParsedExams((prev) =>
      prev.map((e) => (e.tempId === updatedExam.tempId ? updatedExam : e))
    );
  };

  // Batch Save all verified exams
  const handleBatchSave = async () => {
    if (parsedExams.length === 0) return;

    setIsSaving(true);
    setStep(4);
    setErrorMessage("");

    try {
      const payload = {
        defaultCategoryId: selectedCategoryId,
        exams: parsedExams.map((e) => ({
          title: e.title,
          durationMinutes: e.durationMinutes,
          categoryId: e.categoryId || selectedCategoryId,
          isShuffled: false,
          questions: e.questions.map((q) => ({
            content: q.content,
            type: q.type,
            options: q.options,
            correctAnswer: q.correct_answer,
            maxScore: q.max_score,
          })),
        })),
      };

      const res = await fetch("/api/admin/exams/batch-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu danh sách đề thi.");
      }

      setSavedCount(data.savedCount || parsedExams.length);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Lỗi lưu đề thi vào hệ thống.");
      setStep(3); // Return to review table if failed
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered list for Staging Table
  const filteredExams = useMemo(() => {
    if (!searchFilter.trim()) return parsedExams;
    return parsedExams.filter((e) =>
      e.title.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [parsedExams, searchFilter]);

  const totalQuestionsAllExams = useMemo(() => {
    return parsedExams.reduce((sum, e) => sum + e.questionCount, 0);
  }, [parsedExams]);

  const examsWithIssuesCount = useMemo(() => {
    return parsedExams.filter((e) => e.hasIssues).length;
  }, [parsedExams]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleModalClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Main Dialog Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-5xl rounded-3xl bg-[#161a24] border border-[#252a37] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Header Bar */}
        <div className="px-6 py-4.5 border-b border-[#252a37] flex items-center justify-between bg-[#10131b]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Nhập Hàng Loạt Đề Thi Từ Word (.docx)</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20 uppercase">
                  Multi-Exam Splitter
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tự động cắt nhỏ, trích xuất cấu trúc và nhập nhiều đề thi từ 1 tệp duy nhất
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stepper Header Indicator */}
        <div className="grid grid-cols-4 border-b border-[#252a37] text-xs font-medium bg-[#131722] shrink-0">
          {[
            { num: 1, label: "1. Tải lên tệp" },
            { num: 2, label: "2. Tách & Phân tích" },
            { num: 3, label: "3. Duyệt danh sách" },
            { num: 4, label: "4. Hoàn tất" },
          ].map((item) => {
            const isActive = step === item.num;
            const isCompleted = step > item.num;
            return (
              <div
                key={item.num}
                className={`py-2.5 px-3 text-center flex items-center justify-center gap-2 border-r border-[#252a37] last:border-r-0 transition-colors ${
                  isActive
                    ? "bg-white/10 text-white font-bold"
                    : isCompleted
                    ? "text-slate-300 bg-white/[0.02]"
                    : "text-slate-500"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCompleted
                      ? "bg-white text-black"
                      : isActive
                      ? "bg-white text-black"
                      : "bg-[#252a37] text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : item.num}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Content Body Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: UPLOAD FILE & PRE-CONFIGURATION                  */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? "border-white bg-white/10 scale-[1.01]"
                    : file
                    ? "border-white/40 bg-white/[0.03]"
                    : "border-[#252a37] hover:border-white/30 bg-[#10131b]/60 hover:bg-[#10131b]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) validateAndSetFile(f);
                  }}
                />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white shadow-lg">
                  {file ? (
                    <FileText className="h-7 w-7 text-white" />
                  ) : (
                    <UploadCloud className="h-7 w-7 text-white" />
                  )}
                </div>

                {file ? (
                  <div className="space-y-1">
                    <p className="font-heading text-sm font-bold text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Kích thước: {(file.size / 1024).toFixed(1)} KB (Đã sẵn sàng phân tích)
                    </p>
                    <p className="text-[11px] text-slate-400 pt-1">
                      Nhấp vào đây nếu bạn muốn chọn lại tệp khác
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-heading text-sm font-bold text-white">
                      Kéo thả tệp Word (.docx) chứa nhiều đề thi vào đây
                    </p>
                    <p className="text-xs text-slate-400">
                      Hỗ trợ tệp tổng hợp 10, 24 hoặc nhiều đề thi (Tối đa 50MB)
                    </p>
                    <span className="inline-block mt-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-slate-200 transition">
                      Chọn tệp từ máy tính
                    </span>
                  </div>
                )}
              </div>

              {/* Options & Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-[#10131b] border border-[#252a37] p-5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Folder className="h-3.5 w-3.5 text-white" />
                    <span>Lưu vào Danh mục học phần:</span>
                  </label>
                  <PopoverSelect<string>
                    value={selectedCategoryId}
                    onChange={(val) => setSelectedCategoryId(val)}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    buttonClassName="w-full text-xs bg-[#161a24] border-[#252a37] text-white rounded-xl h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-white" />
                    <span>Thời gian làm bài mặc định:</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={240}
                      step={5}
                      value={defaultDuration}
                      onChange={(e) => setDefaultDuration(Number(e.target.value) || 45)}
                      className="w-full rounded-xl border border-[#252a37] bg-[#161a24] px-3 py-2 text-xs text-white focus:border-white/50 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400">phút</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!file}
                  onClick={handleStartExtraction}
                  className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-200 disabled:opacity-40 text-black font-bold px-6 py-2.5 text-xs shadow-lg transition active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Bắt đầu Tách &amp; Phân tích Đề thi (AI)</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: SPLITTING & PARSING PROGRESS BAR                */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="py-12 max-w-lg mx-auto text-center space-y-6">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 shadow-2xl">
                <Sparkles className="h-10 w-10 text-white animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="font-heading text-lg font-bold text-white">
                  Đang xử lý tách đề thi thông minh
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {progressStatus}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#10131b] border border-[#252a37]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-slate-400 via-white to-slate-200"
                    initial={{ width: "10%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Tiến trình xử lý</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#252a37] bg-[#10131b] p-4 text-left text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span>Đọc văn bản Word (.docx) qua Mammoth Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span>Tách tự động theo cú pháp định danh đề thi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  <span>Trích xuất câu hỏi, đáp án qua Gemini 2.5 Flash đa luồng</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: STAGING & REVIEW TABLE                          */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-[#10131b] border border-[#252a37]">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-xs text-slate-300">
                    Tổng số đề bóc tách: <strong className="text-white font-mono text-sm">{parsedExams.length}</strong> đề
                  </span>
                  <span className="text-xs text-slate-300">
                    Tổng câu hỏi: <strong className="text-white font-mono text-sm">{totalQuestionsAllExams}</strong> câu
                  </span>
                  {examsWithIssuesCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" />
                      {examsWithIssuesCount} đề có câu hỏi chưa gán đáp án đúng
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Tìm theo tên đề thi..."
                    className="h-8 text-xs px-3 rounded-xl bg-[#161a24] border border-[#252a37] text-white focus:outline-none focus:border-white/50 w-48"
                  />
                </div>
              </div>

              {/* Staging Table */}
              <div className="rounded-2xl border border-[#252a37] overflow-hidden bg-[#10131b]">
                <div className="overflow-x-auto max-h-[46vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#161a24] border-b border-[#252a37] text-slate-400 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-3.5 w-12 text-center">#</th>
                        <th className="py-3 px-4">Tên đề thi</th>
                        <th className="py-3 px-3 w-28 text-center">Thời lượng</th>
                        <th className="py-3 px-3 w-28 text-center">Số câu</th>
                        <th className="py-3 px-3 w-32 text-center">Trạng thái</th>
                        <th className="py-3 px-4 w-36 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#252a37]">
                      {filteredExams.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            Không tìm thấy đề thi phù hợp.
                          </td>
                        </tr>
                      ) : (
                        filteredExams.map((exam, idx) => (
                          <tr
                            key={exam.tempId}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-3 px-3.5 text-center font-mono text-slate-400 font-bold">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={exam.title}
                                onChange={(e) =>
                                  handleUpdateExamTitle(exam.tempId, e.target.value)
                                }
                                className="w-full bg-transparent font-medium text-white hover:border-[#3b4252] focus:border-white/50 focus:bg-[#161a24] px-2 py-1 rounded-lg border border-transparent transition-colors"
                              />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min={5}
                                  max={240}
                                  value={exam.durationMinutes}
                                  onChange={(e) =>
                                    handleUpdateExamDuration(
                                      exam.tempId,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-14 text-center bg-[#161a24] border border-[#252a37] rounded-lg py-0.5 text-xs text-white"
                                />
                                <span className="text-[11px] text-slate-400">ph</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-white">
                              {exam.questionCount}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {exam.hasIssues ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                  <AlertCircle className="h-3 w-3" />
                                  Thiếu {exam.issuesCount} Đ/A
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white border border-white/20">
                                  <Check className="h-3 w-3" />
                                  Đầy đủ
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setActiveDrawerExam(exam)}
                                  className="p-1.5 rounded-lg border border-[#252a37] bg-[#161a24] hover:bg-white/10 text-slate-300 hover:text-white transition"
                                  title="Xem & Chỉnh sửa câu hỏi"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExam(exam.tempId)}
                                  className="p-1.5 rounded-lg border border-[#252a37] bg-[#161a24] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition"
                                  title="Bỏ đề thi này"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Chọn tệp khác</span>
                </button>

                <button
                  type="button"
                  disabled={parsedExams.length === 0}
                  onClick={handleBatchSave}
                  className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-200 text-black font-bold px-6 py-2.5 text-xs shadow-lg transition active:scale-[0.98] cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Lưu tất cả {parsedExams.length} đề thi vào hệ thống</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: BATCH SAVING & SUCCESS CELEBRATION               */}
          {/* ======================================================== */}
          {step === 4 && (
            <div className="py-12 max-w-md mx-auto text-center space-y-6">
              {isSaving ? (
                <>
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                    <RefreshCw className="h-8 w-8 text-white animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-heading text-lg font-bold text-white">
                      Đang lưu danh sách đề thi vào cơ sở dữ liệu...
                    </h3>
                    <p className="text-xs text-slate-400">
                      Hệ thống đang khởi tạo các bài thi và lưu danh sách câu hỏi đồng bộ.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white shadow-xl">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-heading text-xl font-bold text-white">
                      Nhập Thành Công {savedCount} Đề Thi!
                    </h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                      Toàn bộ các đề thi và câu hỏi đã được lưu trữ an toàn trong hệ thống và sẵn sàng để học viên bắt đầu đánh giá.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        resetState();
                        onClose();
                        onSuccess();
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-200 text-black font-bold px-6 py-2.5 text-xs shadow-lg transition active:scale-[0.98] cursor-pointer"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Xem Danh sách đề thi tại Dashboard</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* EXPANDABLE QUESTION REVIEW DRAWER                        */}
        {/* ======================================================== */}
        <AnimatePresence>
          {activeDrawerExam && (
            <div className="fixed inset-0 z-60 flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveDrawerExam(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-2xl bg-[#131722] border-l border-[#252a37] shadow-2xl h-full flex flex-col z-20"
              >
                {/* Drawer Header */}
                <div className="p-4.5 border-b border-[#252a37] flex items-center justify-between bg-[#10131b]">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-white" />
                      <span className="truncate max-w-md">{activeDrawerExam.title}</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tổng số: {activeDrawerExam.questions.length} câu hỏi
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveDrawerExam(null)}
                    className="p-1.5 rounded-full border border-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Drawer Questions List */}
                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                  {activeDrawerExam.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-[#161a24] border border-[#252a37] space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#252a37]">
                        <span className="font-bold text-xs text-white flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10 text-[11px] font-mono">
                            {idx + 1}
                          </span>
                          <span>{q.type === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"}</span>
                        </span>

                        <div className="flex items-center gap-2">
                          {q.type === "multiple_choice" && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-400">Đáp án đúng:</span>
                              <select
                                value={q.correct_answer || ""}
                                onChange={(e) =>
                                  handleUpdateDrawerQuestion(
                                    q.id,
                                    "correct_answer",
                                    e.target.value
                                  )
                                }
                                className="bg-[#10131b] border border-[#252a37] rounded-lg px-2 py-0.5 text-xs text-white font-bold"
                              >
                                <option value="">-- Chưa chọn --</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                              </select>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteDrawerQuestion(q.id)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Xóa câu này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Content Editor */}
                      <textarea
                        rows={2}
                        value={q.content}
                        onChange={(e) =>
                          handleUpdateDrawerQuestion(q.id, "content", e.target.value)
                        }
                        className="w-full text-xs bg-[#10131b] border border-[#252a37] rounded-xl p-2.5 text-white focus:outline-none focus:border-white/50"
                      />

                      {/* Options Editor */}
                      {q.type === "multiple_choice" && (
                        <div className="space-y-1.5 pt-1">
                          {q.options.map((opt, optIdx) => (
                            <input
                              key={optIdx}
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...q.options];
                                newOpts[optIdx] = e.target.value;
                                handleUpdateDrawerQuestion(q.id, "options", newOpts);
                              }}
                              className="w-full text-xs bg-[#10131b] border border-[#252a37] rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-white/50"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-[#252a37] bg-[#10131b] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveDrawerExam(null)}
                    className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-slate-200 transition"
                  >
                    Xong
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
