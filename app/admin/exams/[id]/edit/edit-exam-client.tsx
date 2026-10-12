"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getExamById, updateExam, getCurrentUser } from "@/lib/store";
import { ParsedQuestionDraft } from "@/types/exam";
import { QuestionEditorCard } from "@/components/admin/QuestionEditorCard";
import { ScoreConfigPanel } from "@/components/admin/ScoreConfigPanel";
import { ExamStatusSelector } from "@/components/admin/ExamStatusSelector";
import {
  ArrowLeft,
  Save,
  Plus,
  Layers,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Shuffle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function EditExamClient({ examId }: { examId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [isShuffled, setIsShuffled] = useState(false);

  const [questions, setQuestions] = useState<ParsedQuestionDraft[]>([]);
  const [mcqScorePerQuestion, setMcqScorePerQuestion] = useState<number>(0.5);
  const [essayScorePerQuestion, setEssayScorePerQuestion] = useState<number>(2.0);
  const [showQuickScoreConfig, setShowQuickScoreConfig] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    async function loadExamData() {
      try {
        const data = await getExamById(examId);
        if (!data) {
          setNotFound(true);
          return;
        }

        setTitle(data.title);
        setDescription(data.description || "");
        setDurationMinutes(Number(data.duration_minutes) || 45);
        setStatus(data.status);
        setIsShuffled(Boolean(data.is_shuffled));

        const loadedDrafts: ParsedQuestionDraft[] = (data.questions || []).map(
          (q) => ({
            id: q.id,
            type: q.type,
            content: q.content,
            options: Array.isArray(q.options) ? q.options : [],
            correct_answer: q.correct_answer || "",
            max_score: Number(q.max_score) || 1,
          })
        );

        setQuestions(loadedDrafts);

        const firstMcq = loadedDrafts.find((q) => q.type === "multiple_choice");
        const firstEssay = loadedDrafts.find((q) => q.type === "essay");
        if (firstMcq) setMcqScorePerQuestion(Number(firstMcq.max_score) || 0.5);
        if (firstEssay)
          setEssayScorePerQuestion(Number(firstEssay.max_score) || 2.0);
      } finally {
        setLoading(false);
      }
    }

    loadExamData();
  }, [examId, router]);

  // Bulk update all Multiple Choice questions
  const handleBulkMcqScoreChange = (scorePerMcq: number) => {
    setMcqScorePerQuestion(scorePerMcq);
    setQuestions((prev) =>
      prev.map((q) =>
        q.type === "multiple_choice" ? { ...q, max_score: scorePerMcq } : q
      )
    );
  };

  // Bulk update all Essay questions
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
      return {
        newMcqScore: mcqScorePerQuestion,
        newEssayScore: essayScorePerQuestion,
      };
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

    const currentEssaySum = essays.reduce(
      (s, q) => s + Number(q.max_score || 0),
      0
    );
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

    const currentTotal = questions.reduce(
      (s, q) => s + Number(q.max_score || 0),
      0
    );
    const ratio = currentTotal > 0 ? desiredTotal / currentTotal : 1;

    const scaledMcq = Math.max(
      0.05,
      Math.round(mcqScorePerQuestion * ratio * 100) / 100
    );
    const scaledEssay = Math.max(
      0.25,
      Math.round(essayScorePerQuestion * ratio * 100) / 100
    );
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

  const handleSaveChanges = async () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tên đề thi.");
      return;
    }
    if (questions.length === 0) {
      alert("Đề thi cần có ít nhất 1 câu hỏi.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateExam(
        examId,
        {
          title: title.trim(),
          description: description.trim(),
          duration_minutes: Number(durationMinutes) || 45,
          status,
          is_shuffled: isShuffled,
        },
        questions
      );

      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 900);
    } catch (err: any) {
      alert("Lỗi khi lưu thay đổi: " + (err?.message || "Vui lòng thử lại"));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto mb-2 h-10 w-10 text-rose-400" />
          <h2 className="text-base font-bold text-white">
            Không tìm thấy đề thi cần chỉnh sửa
          </h2>
          <Link
            href="/admin/dashboard"
            className="mt-4 inline-block text-xs font-semibold text-indigo-400 underline"
          >
            Quay lại Quản lý Ngân hàng Đề thi
          </Link>
        </div>
      </div>
    );
  }

  const mcqQuestions = questions.filter((q) => q.type === "multiple_choice");
  const essayQuestions = questions.filter((q) => q.type === "essay");
  const mcqCount = mcqQuestions.length;
  const essayCount = essayQuestions.length;
  const currentMcqTotal =
    Math.round(
      mcqQuestions.reduce((sum, q) => sum + Number(q.max_score || 0), 0) * 100
    ) / 100;
  const currentEssayTotal =
    Math.round(
      essayQuestions.reduce((sum, q) => sum + Number(q.max_score || 0), 0) * 100
    ) / 100;
  const totalScore =
    Math.round((currentMcqTotal + currentEssayTotal) * 100) / 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-indigo-400" />
          <span>Quay lại Quản lý Ngân hàng Đề thi</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Chỉnh sửa Đề thi
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Cập nhật thông tin chung, nội dung câu hỏi, đáp án đúng và cấu hình phân bổ điểm số.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-3 py-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Đã lưu thay đổi!</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>
        </div>
      </div>

      {/* 1. General Exam Metadata Form */}
      <div className="glass-card mb-8 rounded-2xl p-6">
        <h2 className="mb-4 text-base font-bold text-white">
          Thông tin chung của Đề thi
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Tên đề thi <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên đề thi..."
              className="glass-input h-10 w-full rounded-xl px-3.5 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Mô tả đề thi
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả nội dung hoặc hướng dẫn làm bài..."
              className="glass-input w-full rounded-xl p-3 text-xs"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Thời lượng làm bài (Phút)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={durationMinutes}
              onChange={(e) =>
                setDurationMinutes(parseInt(e.target.value) || 45)
              }
              className="glass-input h-10 w-full rounded-xl px-3.5 text-sm"
            />
          </div>

          <div>
            <ExamStatusSelector
              value={status}
              onChange={setStatus}
              defaultViewMode="dropdown"
            />
          </div>

          {/* Toggle Switch: Shuffle Exam */}
          <div className="sm:col-span-2 rounded-xl bg-slate-900/60 border border-white/10 p-4 transition-all duration-200 hover:border-cyan-500/40">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all ${
                    isShuffled
                      ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      : "border-slate-800 bg-slate-800/60 text-slate-400"
                  }`}
                >
                  <Shuffle className="h-4 w-4" />
                </div>
                <div>
                  <label
                    htmlFor="shuffle-toggle-edit"
                    className="text-sm font-semibold text-white flex items-center gap-2 cursor-pointer"
                  >
                    <span>Trộn ngẫu nhiên câu hỏi & đáp án</span>
                    {isShuffled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                        BẬT (ACTIVE)
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tự động xáo trộn vị trí câu hỏi và các lựa chọn A, B, C, D cho từng lượt thi.
                  </p>
                </div>
              </div>

              {/* Custom Cyberpunk Switch */}
              <button
                type="button"
                id="shuffle-toggle-edit"
                role="switch"
                aria-checked={isShuffled}
                onClick={() => setIsShuffled(!isShuffled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                  isShuffled
                    ? "border-cyan-400 bg-cyan-500/80 shadow-[0_0_14px_rgba(6,182,212,0.5)]"
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

      {/* 2. Quick Score Configuration Toggle & Panel */}
      {questions.length > 0 && (
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowQuickScoreConfig((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <Sliders className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                {showQuickScoreConfig
                  ? "Ẩn bảng Cấu hình điểm nhanh"
                  : "Cấu hình điểm nhanh (Phân bổ điểm hàng loạt)"}
              </span>
            </button>

            <span className="text-xs font-semibold text-slate-300">
              Tổng điểm hiện tại:{" "}
              <strong className="text-indigo-400">{totalScore} điểm</strong>
            </span>
          </div>

          <AnimatePresence initial={false}>
            {showQuickScoreConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. Questions Editor List (Always in Edit Mode) */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              Chỉnh sửa Danh sách Câu hỏi ({questions.length} câu)
            </h2>
            <p className="text-xs text-slate-400">
              {mcqCount} trắc nghiệm ({currentMcqTotal}đ) • {essayCount} tự luận (
              {currentEssayTotal}đ) • Tổng {totalScore} điểm
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
              Đề thi hiện chưa có câu hỏi nào
            </p>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm câu hỏi đầu tiên</span>
            </button>
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
          </div>
        )}

        {/* Bottom Action Bar */}
        {questions.length > 0 && (
          <div className="glass-panel mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl p-5 sm:flex-row">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
              >
                <Plus className="h-4 w-4 text-indigo-400" />
                <span>Thêm câu hỏi mới</span>
              </button>

              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <span>Hủy bỏ</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition active:scale-[0.98] disabled:opacity-50 sm:w-auto"
            >
              <Save className="h-4 w-4" />
              <span>
                {isSaving
                  ? "Đang lưu..."
                  : `Lưu thay đổi (${questions.length} câu • ${totalScore}đ)`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
