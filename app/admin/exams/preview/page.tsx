"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  getExamById,
  updateExamQuestionsScore,
  getCurrentUser,
} from "@/lib/store";
import { Exam, Question } from "@/types/exam";
import { formatDuration } from "@/lib/utils";
import { ScoreConfigPanel } from "@/components/admin/ScoreConfigPanel";
import { NumberStepper } from "@/components/ui/NumberStepper";
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  CheckCircle2,
  FileText,
  Send,
  Pencil,
} from "lucide-react";

function AdminExamPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("id");
  const reduceMotion = useReducedMotion();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mcqScorePerQuestion, setMcqScorePerQuestion] = useState<number>(0.5);
  const [essayScorePerQuestion, setEssayScorePerQuestion] = useState<number>(2.0);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    async function loadExam() {
      if (!examId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getExamById(examId);
        setExam(data);
        if (data?.questions) {
          setQuestions(data.questions);
          const firstMcq = data.questions.find((q) => q.type === "multiple_choice");
          const firstEssay = data.questions.find((q) => q.type === "essay");
          if (firstMcq) setMcqScorePerQuestion(Number(firstMcq.max_score) || 0.5);
          if (firstEssay) setEssayScorePerQuestion(Number(firstEssay.max_score) || 2.0);
        }
      } finally {
        setLoading(false);
      }
    }

    loadExam();
  }, [examId, router]);

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

  const handleConfirmPublish = async () => {
    if (!exam) return;
    setPublishing(true);
    try {
      await updateExamQuestionsScore(exam.id, questions, true);
      router.push("/admin/dashboard");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center p-4">
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-8 text-center shadow-xl">
          <h2 className="text-base font-bold text-white">Không tìm thấy đề thi</h2>
          <Link
            href="/admin/dashboard"
            className="mt-4 inline-block text-xs font-semibold text-white underline"
          >
            Quay lại Bảng điều khiển Quản trị
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
    Math.round(mcqQuestions.reduce((sum, q) => sum + Number(q.max_score || 0), 0) * 100) / 100;
  const currentEssayTotal =
    Math.round(essayQuestions.reduce((sum, q) => sum + Number(q.max_score || 0), 0) * 100) / 100;
  const totalScore = Math.round((currentMcqTotal + currentEssayTotal) * 100) / 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Action Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-[#10131B] border border-[#2A2F3C] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#161A24] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white" />
          <span>Quay lại Quản trị</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/admin/exams/${exam.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#10131B] border border-[#2A2F3C] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#161A24] hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5 text-white" />
            <span>Chỉnh sửa câu hỏi</span>
          </Link>

          <button
            type="button"
            onClick={handleConfirmPublish}
            disabled={publishing}
            className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-200 px-5 py-2 text-xs font-bold text-black shadow-md transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>
              {publishing
                ? "Đang lưu..."
                : `Xác nhận & Tải đề lên (${totalScore}đ)`}
            </span>
          </button>
        </div>
      </div>

      {/* Exam Overview Header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl border border-[#252A37] bg-[#161A24] mb-6 p-6 sm:p-8 shadow-xl"
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#232836] border border-[#2A2F3C] px-3 py-1 text-xs font-medium text-white">
            <Clock className="h-3.5 w-3.5 text-white" />
            Thời lượng quy định: {formatDuration(exam.duration_minutes)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#232836] border border-[#2A2F3C] px-3 py-1 text-xs font-medium text-white">
            <HelpCircle className="h-3.5 w-3.5 text-white" />
            Tổng {questions.length} câu hỏi ({totalScore} điểm)
          </span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          {exam.title}
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">
          {exam.description || "Đề thi thử trực tuyến."}
        </p>
      </motion.div>

      {/* Score Settings Panel */}
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

      {/* Read-Only Questions List with Manual Score Override */}
      <div className="space-y-5">
        {questions.map((q, index) => {
          const isMCQ = q.type === "multiple_choice";

          return (
            <motion.article
              key={q.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl border border-[#252A37] bg-[#161A24] p-6 shadow-xl"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#252A37] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#252A37] bg-[#10131B] text-xs font-bold text-white tabular-nums">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {isMCQ ? "Trắc nghiệm" : "Tự luận"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 rounded-full border border-[#252A37] bg-[#10131B] px-3 py-1">
                    <span className="text-[11px] font-medium text-[#9CA3AF]">
                      Điểm câu này:
                    </span>
                    <NumberStepper
                      value={q.max_score}
                      onChange={(val) => handleManualScoreOverride(index, String(val))}
                      min={0.05}
                      max={100}
                      step={0.25}
                    />
                    <span className="text-[11px] font-semibold text-slate-300">đ</span>
                  </div>

                  {isMCQ && q.correct_answer && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-[#232836] px-3 py-1 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Đáp án đúng: {q.correct_answer}
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-100">
                {q.content}
              </p>

              {isMCQ ? (
                <div className="space-y-2">
                  {q.options.map((optText, optIdx) => {
                    const letterMatch = optText.match(/^([A-Z])[\.\:\)]/i);
                    const letter = letterMatch
                      ? letterMatch[1].toUpperCase()
                      : String.fromCharCode(65 + optIdx);
                    const isCorrect =
                      q.correct_answer.toUpperCase() === letter ||
                      q.correct_answer.toUpperCase().startsWith(letter);

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-xs leading-relaxed transition ${
                          isCorrect
                            ? "border-emerald-500/40 bg-[#232836] text-emerald-300 font-semibold"
                            : "border-[#252A37] bg-[#10131B] text-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isCorrect
                                ? "border border-emerald-500/40 bg-[#161A24] text-emerald-300"
                                : "border border-[#252A37] bg-[#161A24] text-slate-300"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="pt-0.5">{optText}</span>
                        </div>

                        {isCorrect && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/40 bg-[#161A24] px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span>Đáp án đúng</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-[#252A37] bg-[#10131B] p-3.5 text-xs text-slate-300">
                  <FileText className="h-4 w-4 shrink-0 text-white" />
                  <span>
                    Câu hỏi tự luận (Điểm tối đa: {q.max_score} điểm • Chấm tự động bằng Gemini AI hoặc Giảng viên duyệt).
                  </span>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>

      {/* Bottom Bar */}
      <div className="rounded-3xl border border-[#252A37] bg-[#161A24] mt-8 flex flex-col items-center justify-between gap-4 p-6 sm:flex-row shadow-xl">
        <div>
          <h4 className="text-sm font-bold text-white">
            Đã kiểm tra toàn bộ cấu trúc và thang điểm đề thi?
          </h4>
          <p className="text-xs text-[#9CA3AF]">
            Tổng cộng {questions.length} câu hỏi • Tổng điểm {totalScore} điểm.
          </p>
        </div>

        <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
          <Link
            href="/admin/dashboard"
            className="rounded-full bg-[#10131B] border border-[#2A2F3C] px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-[#161A24] hover:text-white"
          >
            Quay lại Quản trị
          </Link>
          <button
            type="button"
            onClick={handleConfirmPublish}
            disabled={publishing}
            className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-200 px-6 py-2.5 text-xs font-bold text-black shadow-md transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>
              {publishing
                ? "Đang lưu..."
                : `Xác nhận & Tải đề lên (Tổng ${totalScore}đ)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminExamPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      }
    >
      <AdminExamPreviewContent />
    </Suspense>
  );
}
