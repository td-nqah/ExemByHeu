"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getExamById, submitExam, finalizeGrading, getCurrentUser } from "@/lib/store";
import { Exam, Submission } from "@/types/exam";
import { StickyTimer } from "@/components/exam/StickyTimer";
import { QuestionNav } from "@/components/exam/QuestionNav";
import { MobileQuestionDrawer } from "@/components/exam/MobileQuestionDrawer";
import { SubmitConfirmModal } from "@/components/exam/SubmitConfirmModal";
import {
  Send,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  User,
  ListChecks,
  History,
  ArrowRight,
  Flag,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function ExamRoomClient({ examId }: { examId: string }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSubmission, setCompletedSubmission] = useState<Submission | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const toggleFocusMode = async () => {
    const nextState = !isFocusMode;
    setIsFocusMode(nextState);

    // Fullscreen API integration (optional browser enhancement)
    try {
      if (typeof document !== "undefined") {
        if (nextState) {
          if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            await document.documentElement.requestFullscreen().catch(() => {});
          }
        } else {
          if (document.exitFullscreen && document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
          }
        }
      }
    } catch {
      // Ignored if browser policy denies fullscreen request
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFocusMode]);

  const toggleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };
  const [aiGradingState, setAiGradingState] = useState<{
    isGrading: boolean;
    statusText: string;
  }>({
    isGrading: false,
    statusText: "",
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }

    async function loadExam() {
      try {
        const data = await getExamById(examId);
        if (!data) {
          router.push("/dashboard");
          return;
        }
        setExam(data);
        if (data.questions && data.questions.length > 0) {
          setActiveQuestionId(data.questions[0].id);
        }
      } finally {
        setLoading(false);
      }
    }

    loadExam();
  }, [examId, router]);

  const handleSelectMCQ = (questionId: string, optionText: string) => {
    const letterMatch = optionText.match(/^([A-D])[\.\:\)]/i);
    const letter = letterMatch ? letterMatch[1].toUpperCase() : optionText;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: letter,
    }));
  };

  const handleEssayChange = (questionId: string, text: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handlePerformSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);
    try {
      const submission = await submitExam(examId, userAnswers);
      setCompletedSubmission(submission);

      const essayQuestions = (exam?.questions || []).filter((q) => q.type === "essay");

      if (essayQuestions.length > 0) {
        setAiGradingState({
          isGrading: true,
          statusText: "Đang chờ chấm tự luận (Gemini AI đang phân tích câu trả lời)...",
        });

        try {
          const res = await fetch("/api/ai/grade-submission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              submissionId: submission.id,
              examId,
              essayQuestions: essayQuestions.map((q) => ({
                questionId: q.id,
                content: q.content,
                studentAnswer: userAnswers[q.id] || "",
                maxScore: q.max_score || 5.0,
              })),
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const updatedSub = await finalizeGrading(submission.id, data.results);
              if (updatedSub) {
                setCompletedSubmission(updatedSub);
              }
            }
          }
        } catch (e) {
          console.warn("Lỗi AI chấm nhanh:", e);
        } finally {
          setAiGradingState({
            isGrading: false,
            statusText: "Đã hoàn tất chấm điểm!",
          });
        }
      }
    } catch (err: any) {
      alert("Lỗi khi nộp bài: " + (err?.message || "Vui lòng thử lại"));
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setAiGradingState({ isGrading: false, statusText: "" });
    }
  }, [examId, exam, userAnswers, isSubmitting]);

  const scrollToQuestion = (questionId: string) => {
    setActiveQuestionId(questionId);
    const el = document.getElementById(`q_${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="glass-card rounded-2xl px-8 py-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-300">
            Đang tải phòng thi thử trực tuyến...
          </p>
        </div>
      </div>
    );
  }

  if (!exam || !exam.questions) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-400" />
          <h2 className="text-base font-bold text-white">Không tìm thấy bài thi</h2>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-xs font-semibold text-indigo-400 underline"
          >
            Quay lại Bảng điều khiển
          </Link>
        </div>
      </div>
    );
  }

  const questions = exam.questions;
  const answeredCount = questions.filter((q) => (userAnswers[q.id] || "").trim().length > 0).length;
  const hasEssay = questions.some((q) => q.type === "essay");

  return (
    <div
      className={cn(
        "min-h-[100dvh] pb-24 transition-colors duration-500",
        isFocusMode ? "bg-[#070A10]" : "bg-[#0B0F17]"
      )}
    >
      {/* Top Header Bar: Dynamic between Standard & Zen Focus Mode */}
      <header
        className={cn(
          "sticky top-0 z-30 transition-all duration-300",
          isFocusMode
            ? "border-b border-indigo-500/20 bg-[#070A10]/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
            : "border-b border-slate-800/80 bg-[#090D16]/85 backdrop-blur-md"
        )}
      >
        <div
          className={cn(
            "mx-auto flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8 transition-all duration-300",
            isFocusMode ? "max-w-4xl" : "max-w-7xl"
          )}
        >
          {/* Left Side: Back Button / Mode Badge + Digital Countdown Timer */}
          <div className="flex items-center gap-3">
            {!isFocusMode && (
              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-900/90 border border-slate-800 p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="h-4 w-4 text-indigo-400" />
              </Link>
            )}

            {!completedSubmission && (
              <StickyTimer
                durationMinutes={exam.duration_minutes}
                onTimeUp={handlePerformSubmit}
              />
            )}

            {isFocusMode ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span>Chế độ Tập trung</span>
              </div>
            ) : (
              <div className="hidden md:block pl-1">
                <h1 className="line-clamp-1 max-w-xs text-sm font-bold text-white lg:max-w-md">
                  {exam.title}
                </h1>
              </div>
            )}
          </div>

          {/* Right Side: Total Questions + User Status + Focus Mode Toggle + Submit CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {!isFocusMode && (
              <>
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200">
                  <ListChecks className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Tổng {questions.length} câu hỏi</span>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300">
                  <User className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{getCurrentUser()?.username || "Thí sinh"}</span>
                </div>
              </>
            )}

            {isFocusMode && (
              <span className="hidden sm:inline-block text-xs font-medium text-slate-400">
                Đã làm: <strong className="text-emerald-400 font-semibold">{answeredCount}/{questions.length}</strong>
              </span>
            )}

            {/* Focus Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleFocusMode}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95 border",
                isFocusMode
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800 hover:text-white"
              )}
              title={isFocusMode ? "Thoát Chế độ Tập trung" : "Bật Chế độ Tập trung (Zen Mode)"}
            >
              {isFocusMode ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Thoát Tập trung</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Chế độ Tập trung</span>
                </>
              )}
            </button>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition active:scale-[0.98] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Nộp bài ({answeredCount}/{questions.length})</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "mx-auto px-4 py-6 sm:px-6 lg:px-8 transition-all duration-300",
          isFocusMode ? "max-w-4xl" : "max-w-7xl"
        )}
      >
        <div className={cn("grid grid-cols-1 gap-6", !isFocusMode && "md:grid-cols-12")}>
          {/* Desktop Question Index Sidebar - Hidden on mobile (< 768px) and Hidden in Focus Mode */}
          {!isFocusMode && (
            <aside className="hidden md:block md:col-span-4 lg:col-span-4 xl:col-span-3">
              <div className="sticky top-20 space-y-4">
                <QuestionNav
                  questions={questions}
                  userAnswers={userAnswers}
                  flaggedQuestions={flaggedQuestions}
                  activeQuestionId={activeQuestionId}
                  onSelectQuestion={scrollToQuestion}
                />

                <div className="bg-[#0C1017] border border-slate-800/90 rounded-2xl p-4 text-xs text-slate-300">
                  <p className="mb-1.5 font-bold text-white">Quy định phòng thi thử:</p>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] text-slate-400">
                    <li>Điểm trắc nghiệm được chấm tự động ngay khi nộp bài.</li>
                    <li>Câu hỏi tự luận được lưu trữ và chấm điểm trên thang điểm chuẩn.</li>
                    <li>Khi hết thời gian, hệ thống tự động khóa và gửi bài làm.</li>
                  </ul>
                </div>
              </div>
            </aside>
          )}

          <main
            className={cn(
              "space-y-6",
              isFocusMode ? "w-full" : "md:col-span-8 lg:col-span-8 xl:col-span-9"
            )}
          >
            {questions.map((question, index) => {
              const currentVal = userAnswers[question.id] || "";
              const isAnswered = currentVal.trim().length > 0;
              const isFlagged = Boolean(flaggedQuestions[question.id]);

              return (
                <motion.article
                  key={question.id}
                  id={`q_${question.id}`}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
                  onClick={() => setActiveQuestionId(question.id)}
                  className={cn(
                    "glow-card scroll-mt-24 rounded-2xl transition",
                    isFocusMode
                      ? "p-6 sm:p-8 bg-slate-950/85 border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
                      : "p-6",
                    activeQuestionId === question.id
                      ? "border-indigo-500/60 ring-1 ring-indigo-500/30"
                      : isFlagged
                      ? "border-amber-400/60 ring-1 ring-amber-400/20"
                      : ""
                  )}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-xs font-bold text-indigo-400">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {question.type === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Bookmark / Review Flag button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFlagQuestion(question.id);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                          isFlagged
                            ? "border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                            : "border-slate-700/60 bg-slate-900/80 text-slate-400 hover:border-amber-500/50 hover:text-amber-300"
                        }`}
                        title={
                          isFlagged
                            ? "Bỏ cờ đánh dấu xem lại"
                            : "Đánh dấu câu hỏi này để xem lại trước khi nộp bài"
                        }
                      >
                        <Flag
                          className={`h-3 w-3 ${
                            isFlagged ? "fill-current text-amber-300" : "text-slate-400"
                          }`}
                        />
                        <span>{isFlagged ? "Đang đánh dấu" : "Đánh dấu xem lại"}</span>
                      </button>

                      <span className="rounded-lg bg-slate-800/90 border border-slate-700/50 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                        Điểm: {question.max_score}
                      </span>

                      {isAnswered ? (
                        <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                          Đã làm
                        </span>
                      ) : (
                        <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                          Chưa làm
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    className={cn(
                      "mb-5 whitespace-pre-wrap font-medium text-slate-100",
                      isFocusMode
                        ? "text-base sm:text-[17px] leading-relaxed"
                        : "text-sm leading-relaxed"
                    )}
                  >
                    {question.content}
                  </p>

                  {question.type === "multiple_choice" ? (
                    <div className="space-y-2.5" role="radiogroup" aria-label={`Câu hỏi ${index + 1}`}>
                      {question.options.map((optText, optIdx) => {
                        const letterMatch = optText.match(/^([A-D])[\.\:\)]/i);
                        const letter = letterMatch
                          ? letterMatch[1].toUpperCase()
                          : String.fromCharCode(65 + optIdx);
                        const isSelected = currentVal === letter;

                        return (
                          <label
                            key={optIdx}
                            onClick={() => handleSelectMCQ(question.id, optText)}
                            className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left text-xs transition ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500/30"
                                : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`mcq_${question.id}`}
                              value={letter}
                              checked={isSelected}
                              onChange={() => handleSelectMCQ(question.id, optText)}
                              className="sr-only"
                            />
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                                isSelected
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                  : "border border-slate-700 bg-slate-800 text-slate-300"
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{optText}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        rows={6}
                        value={currentVal}
                        onChange={(e) => handleEssayChange(question.id, e.target.value)}
                        placeholder="Nhập phần trả lời tự luận của bạn vào đây..."
                        className="glass-input w-full rounded-xl p-4 text-xs leading-relaxed"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          Số từ: {currentVal.trim() ? currentVal.trim().split(/\s+/).length : 0} từ
                        </span>
                        <span>{currentVal.length} ký tự</span>
                      </div>
                    </div>
                  )}

                  {/* Prev / Next Question Navigation Toolbar */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-3.5 text-xs">
                    {index > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToQuestion(questions[index - 1].id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition active:scale-95"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Câu trước</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <span className="text-[11px] text-slate-500 font-mono">
                      Câu {index + 1} / {questions.length}
                    </span>

                    {index < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToQuestion(questions[index + 1].id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 transition active:scale-95 font-medium"
                      >
                        <span>Câu tiếp theo</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95 font-medium shadow-md shadow-indigo-600/30"
                      >
                        <span>Hoàn thành & Nộp</span>
                        <Send className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}

            <div className="glass-panel flex flex-col items-center justify-between gap-4 rounded-2xl p-6 sm:flex-row">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Hoàn thành bài làm của bạn?
                </h4>
                <p className="text-xs text-slate-400">
                  Bạn đã trả lời {answeredCount} trên tổng số {questions.length} câu hỏi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition active:scale-[0.98] sm:w-auto"
              >
                <Send className="h-4 w-4" />
                <span>Nộp bài ngay</span>
              </button>
            </div>
          </main>
        </div>
      </div>

      <SubmitConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handlePerformSubmit}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        isSubmitting={isSubmitting}
      />

      {/* Instant Submission Summary Modal */}
      <AnimatePresence>
        {completedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22 }}
              className="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-7 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                {aiGradingState.isGrading ? (
                  <Sparkles className="h-7 w-7 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                )}
              </div>

              <h3 className="text-lg font-bold text-white">
                Đã nộp bài thi thành công
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Kết quả chấm điểm tức thời cho bài làm của bạn
              </p>

              {/* Summary Pill Box: "Trắc nghiệm: X điểm - Tự luận: Đang chờ chấm" */}
              <div className="my-5 space-y-2.5 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Trắc nghiệm:</span>
                  <span className="font-bold text-emerald-400">
                    {completedSubmission.mcq_score} điểm
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-2.5 text-xs">
                  <span className="text-slate-300 font-medium">Tự luận:</span>
                  <span className="font-bold text-indigo-400">
                    {!hasEssay
                      ? "Không có câu tự luận"
                      : completedSubmission.status === "graded" && completedSubmission.essay_score !== null
                      ? `${completedSubmission.essay_score} điểm (Đã chấm)`
                      : "Đang chờ chấm"}
                  </span>
                </div>

                <div className="mt-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-center text-[11px] font-semibold text-indigo-300">
                  Trắc nghiệm: {completedSubmission.mcq_score} điểm - Tự luận:{" "}
                  {!hasEssay
                    ? "0 điểm"
                    : completedSubmission.status === "graded" && completedSubmission.essay_score !== null
                    ? `${completedSubmission.essay_score} điểm`
                    : "Đang chờ chấm"}
                </div>
              </div>

              {aiGradingState.isGrading && (
                <p className="mb-4 text-[11px] text-slate-300">
                  {aiGradingState.statusText}
                </p>
              )}

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/history")}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Đến Lịch sử làm bài</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/history/${completedSubmission.id}`)
                  }
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Floating Menu Button & Drawer (< 768px) */}
      {!completedSubmission && (
        <MobileQuestionDrawer
          questions={questions}
          userAnswers={userAnswers}
          flaggedQuestions={flaggedQuestions}
          activeQuestionId={activeQuestionId}
          onSelectQuestion={scrollToQuestion}
          isFocusMode={isFocusMode}
        />
      )}
    </div>
  );
}
