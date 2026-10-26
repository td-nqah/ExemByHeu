"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getExamById,
  submitExam,
  finalizeGrading,
  getCurrentUser,
  getQuestionOptionsWithIds,
  shuffleArray,
} from "@/lib/store";
import { Exam, Submission, QuestionOptionItem } from "@/types/exam";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function ExamRoomClient({ examId }: { examId: string }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSubmission, setCompletedSubmission] = useState<Submission | null>(null);

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

        let processedExam = data;
        if (data.questions && data.questions.length > 0) {
          let questionsList = [...data.questions];

          // If is_shuffled is active:
          // 1. Shuffle question order with Fisher-Yates
          if (data.is_shuffled) {
            questionsList = shuffleArray(questionsList);
          }

          // 2. Prepare and shuffle option_items for each question
          const processedQuestions = questionsList.map((q) => {
            if (q.type === "multiple_choice" && Array.isArray(q.options) && q.options.length > 0) {
              const baseOpts = getQuestionOptionsWithIds(q);
              const option_items: QuestionOptionItem[] = baseOpts.map((opt, idx) => ({
                id: opt.id,
                original_letter: opt.original_letter,
                display_letter: opt.original_letter || String.fromCharCode(65 + idx),
                text: opt.clean_text,
              }));

              return {
                ...q,
                option_items,
              };
            }
            return q;
          });

          processedExam = {
            ...data,
            questions: processedQuestions,
          };
        }

        setExam(processedExam);
        if (processedExam.questions && processedExam.questions.length > 0) {
          setActiveQuestionId(processedExam.questions[0].id);
        }
      } catch (err) {
        console.error("Failed to load exam:", err);
      } finally {
        setLoading(false);
      }
    }

    loadExam();
  }, [examId, router]);

  const handleSelectMCQ = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Keyboard shortcut listener for fast answering (A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "INPUT" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (isSubmitting || completedSubmission) return;

      const key = e.key.toUpperCase();
      if (["A", "B", "C", "D"].includes(key)) {
        const qId = activeQuestionId || exam?.questions?.[0]?.id;
        if (!qId || !exam) return;
        const currentQ = exam.questions?.find((q) => q.id === qId);
        if (currentQ?.type === "multiple_choice") {
          const optIndex = key.charCodeAt(0) - 65;
          const optionId = currentQ.option_items?.[optIndex]?.id || `${currentQ.id}_opt_${optIndex}`;
          handleSelectMCQ(qId, optionId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeQuestionId, exam, isSubmitting, completedSubmission]);

  const handleEssayChange = (questionId: string, text: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  // Nộp bài thi
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
          statusText: "Đang xử lý đánh giá tự luận (Trợ lý học thuật AI đang đối sánh barem)...",
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
        } catch (aiErr) {
          console.warn("AI grading error, saved as pending:", aiErr);
        } finally {
          setAiGradingState({ isGrading: false, statusText: "" });
        }
      }
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Nộp bài thất bại. Vui lòng kiểm tra lại kết nối mạng!");
    } finally {
      setIsSubmitting(false);
    }
  }, [examId, userAnswers, exam, isSubmitting]);

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
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] px-8 py-6 text-center shadow-xl">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-slate-300">
            Đang kết nối phòng thi trực tuyến...
          </p>
        </div>
      </div>
    );
  }

  if (!exam || !exam.questions) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-400" />
          <h2 className="text-base font-bold text-white">Không tìm thấy bài đánh giá</h2>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center rounded-full bg-white px-5 py-2 text-xs font-bold text-black hover:bg-slate-200 transition"
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
      ref={containerRef}
      className="min-h-[100dvh] pb-24 bg-transparent"
    >
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-[#1B1F2A] bg-[#0A0C12]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 items-center justify-between gap-2.5 px-3 sm:px-6 lg:px-8 max-w-7xl">
          {/* Left Side: Back Button + Sticky Timer + Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-[#10131B] border border-[#252A37] p-2 text-white transition hover:bg-[#161A24]"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </Link>

            {!completedSubmission && (
              <StickyTimer
                durationMinutes={exam.duration_minutes}
                onTimeUp={handlePerformSubmit}
              />
            )}

            <div className="hidden md:block pl-1">
              <h1 className="line-clamp-1 max-w-xs text-sm font-bold text-white lg:max-w-md tracking-tight">
                {exam.title}
              </h1>
            </div>
          </div>

          {/* Right Side: Questions badge + User + Submit CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[#10131B] border border-[#252A37] px-3.5 py-1.5 text-xs font-medium text-[#9CA3AF]">
              <ListChecks className="h-3.5 w-3.5 text-white" />
              <span>Tổng <strong className="font-mono font-bold text-white">{questions.length}</strong> câu</span>
            </div>

            <div className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-[#10131B] border border-[#252A37] px-3.5 py-1.5 text-xs font-medium text-[#9CA3AF]">
              <User className="h-3.5 w-3.5 text-white" />
              <span>{getCurrentUser()?.username || "User"}</span>
            </div>

            {/* Submit Button */}
            {!completedSubmission && (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-200 px-4 sm:px-5 py-2 text-xs font-bold text-[#05070D] shadow-lg transition active:scale-[0.98] disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-[#05070D]" />
                <span>Nộp bài thi</span>
                <span className="hidden sm:inline font-mono font-bold text-slate-700">({answeredCount}/{questions.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8 transition-all duration-300 w-full max-w-7xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Desktop Question Index Sidebar - Hidden on mobile (< 768px) */}
          <aside className="hidden md:block md:col-span-4 lg:col-span-4 xl:col-span-3">
            <div className="sticky top-20 space-y-4">
              <QuestionNav
                questions={questions}
                userAnswers={userAnswers}
                flaggedQuestions={flaggedQuestions}
                activeQuestionId={activeQuestionId}
                onSelectQuestion={scrollToQuestion}
              />

              <div className="bg-[#161A24] border border-[#252A37] rounded-3xl p-5 text-xs text-[#9CA3AF] shadow-xl">
                <p className="mb-3 font-heading font-bold uppercase tracking-wide text-white text-xs">Quy chế phòng thi:</p>
                <ul className="space-y-2 text-xs text-[#9CA3AF] leading-relaxed list-none p-0 m-0">
                  <li className="flex items-start gap-2" style={{ paddingLeft: "1cm" }}>
                    <span className="select-none text-slate-400 shrink-0 font-medium">–</span>
                    <span>Điểm trắc nghiệm được hệ thống tự động ghi nhận khi nộp bài.</span>
                  </li>
                  <li className="flex items-start gap-2" style={{ paddingLeft: "1cm" }}>
                    <span className="select-none text-slate-400 shrink-0 font-medium">–</span>
                    <span>Bài làm tự luận được lưu trữ và chấm điểm theo barem đánh giá học phần.</span>
                  </li>
                  <li className="flex items-start gap-2" style={{ paddingLeft: "1cm" }}>
                    <span className="select-none text-slate-400 shrink-0 font-medium">–</span>
                    <span>Khi hết thời gian, hệ thống tự động khóa và gửi bài làm.</span>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          <main className="space-y-6 md:col-span-8 lg:col-span-8 xl:col-span-9">
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
                    "scroll-mt-24 rounded-3xl border border-[#252A37] bg-[#161A24] transition p-6 shadow-xl",
                    activeQuestionId === question.id
                      ? "border-white/50 ring-1 ring-white/30"
                      : isFlagged
                      ? "border-amber-400/60 ring-1 ring-amber-400/20"
                      : ""
                  )}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#252A37] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#252A37] bg-[#10131B] text-xs font-mono font-bold text-white">
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
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border transition-all cursor-pointer ${
                          isFlagged
                            ? "border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                            : "border-[#252A37] bg-[#10131B] text-[#9CA3AF] hover:border-amber-400/50 hover:text-amber-300"
                        }`}
                        title={
                          isFlagged
                            ? "Bỏ cờ đánh dấu xem lại"
                            : "Đánh dấu câu hỏi này để xem lại trước khi nộp bài"
                        }
                      >
                        <Flag
                          className={`h-3 w-3 ${
                            isFlagged ? "fill-current text-amber-300" : "text-[#8B93A5]"
                          }`}
                        />
                        <span>{isFlagged ? "Đang đánh dấu" : "Đánh dấu xem lại"}</span>
                      </button>

                      <span className="rounded-full bg-[#10131B] border border-[#252A37] px-3 py-1 text-[11px] font-medium text-[#9CA3AF]">
                        Điểm: <span className="font-bold text-white font-mono tabular-nums">{question.max_score}</span>
                      </span>

                      {isAnswered ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                          Đã làm
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#10131B] border border-[#252A37] px-3 py-1 text-[11px] font-medium text-[#8B93A5]">
                          Chưa làm
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mb-5 whitespace-pre-wrap font-medium text-slate-100 text-sm sm:text-base leading-relaxed">
                    {question.content}
                  </p>

                  {question.type === "multiple_choice" ? (
                    <div className="space-y-2.5" role="radiogroup" aria-label={`Câu hỏi ${index + 1}`}>
                      {(question.option_items && question.option_items.length > 0
                        ? question.option_items
                        : (question.options || []).map((optText, optIdx) => {
                            const letterMatch = optText.match(/^([A-D])[\.\:\)]/i);
                            const letter = letterMatch
                              ? letterMatch[1].toUpperCase()
                              : String.fromCharCode(65 + optIdx);
                            const cleanText = optText.replace(/^[A-Z][\.\:\)]\s*/i, "").trim();
                            return {
                              id: `${question.id}_opt_${optIdx}`,
                              original_letter: letter,
                              display_letter: letter,
                              text: cleanText || optText,
                            };
                          })
                      ).map((optItem) => {
                        const isSelected = currentVal === optItem.id;

                        return (
                          <label
                            key={optItem.id}
                            onClick={() => handleSelectMCQ(question.id, optItem.id)}
                            className={cn(
                              "flex w-full cursor-pointer items-start gap-3.5 rounded-2xl border text-left transition select-none p-3.5 text-xs sm:text-sm",
                              isSelected
                                ? "border-white bg-[#232836] text-white shadow-md ring-1 ring-white/30"
                                : "border-[#252A37] bg-[#10131B] text-slate-300 hover:border-white/30 hover:bg-[#141824]"
                            )}
                          >
                            <input
                              type="radio"
                              name={`mcq_${question.id}`}
                              value={optItem.id}
                              checked={isSelected}
                              onChange={() => handleSelectMCQ(question.id, optItem.id)}
                              className="sr-only"
                            />
                            <span
                              className={cn(
                                "flex shrink-0 items-center justify-center rounded-xl font-bold font-mono transition h-6 w-6 text-xs",
                                isSelected
                                  ? "bg-white text-black shadow-sm"
                                  : "border border-[#252A37] bg-[#161A24] text-[#8B93A5]"
                              )}
                            >
                              {optItem.display_letter}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{optItem.text}</span>
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
                        className="w-full rounded-2xl border border-[#252A37] bg-[#10131B] p-4 text-xs sm:text-sm text-white placeholder-[#8B93A5] focus:border-white/50 focus:outline-none transition-colors"
                      />
                      <div className="flex items-center justify-between text-[11px] text-[#8B93A5] font-mono">
                        <span>
                          Số từ: <span className="font-bold text-white">{currentVal.trim() ? currentVal.trim().split(/\s+/).length : 0}</span> từ
                        </span>
                        <span><span className="font-bold text-white">{currentVal.length}</span> ký tự</span>
                      </div>
                    </div>
                  )}

                  {/* Prev / Next Question Navigation Toolbar */}
                  <div className="mt-6 flex items-center justify-between border-t border-[#252A37] pt-3.5 text-xs">
                    {index > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToQuestion(questions[index - 1].id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[#9CA3AF] hover:text-white bg-[#10131B] border border-[#252A37] transition active:scale-95 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Câu trước</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <span className="text-xs font-mono font-medium text-[#8B93A5]">
                      Câu <span className="font-bold text-white">{index + 1}</span> / <span>{questions.length}</span>
                    </span>

                    {index < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToQuestion(questions[index + 1].id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-white bg-[#10131B] hover:bg-[#161A24] border border-[#252A37] transition active:scale-95 font-medium cursor-pointer"
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
                        className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 bg-white hover:bg-slate-200 text-[#05070D] transition active:scale-95 font-bold shadow-lg cursor-pointer"
                      >
                        <span>Hoàn thành & Nộp</span>
                        <Send className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}

            <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-[#252A37] bg-[#161A24] p-6 sm:flex-row shadow-xl">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Hoàn thành bài làm của bạn?
                </h4>
                <p className="text-xs text-[#9CA3AF]">
                  Bạn đã trả lời {answeredCount} trên tổng số {questions.length} câu hỏi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white hover:bg-slate-200 px-7 py-3 text-xs font-bold text-[#05070D] shadow-xl transition active:scale-[0.98] sm:w-auto cursor-pointer"
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
              className="w-full max-w-md rounded-3xl border border-[#252A37] bg-[#161A24] p-6 sm:p-7 text-center shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#252A37] bg-[#10131B] text-white">
                {aiGradingState.isGrading ? (
                  <Sparkles className="h-7 w-7 animate-spin text-white" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                )}
              </div>

              <h3 className="text-lg font-bold text-white">
                Đã nộp bài thi thành công
              </h3>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Kết quả chấm điểm tức thời cho bài làm của bạn
              </p>

              {/* Summary Pill Box */}
              <div className="my-5 space-y-2.5 rounded-2xl border border-[#252A37] bg-[#10131B] p-4 text-left font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8B93A5] uppercase tracking-wider">Trắc nghiệm:</span>
                  <span className="font-bold text-emerald-400">
                    {completedSubmission.mcq_score} điểm
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-[#252A37] pt-2.5 text-xs">
                  <span className="text-[#8B93A5] uppercase tracking-wider">Tự luận:</span>
                  <span className="font-bold text-white">
                    {!hasEssay
                      ? "Không có câu tự luận"
                      : completedSubmission.status === "graded" && completedSubmission.essay_score !== null
                      ? `${completedSubmission.essay_score} điểm (Đã chấm)`
                      : "Đang chờ chấm"}
                  </span>
                </div>

                <div className="mt-2 rounded-full border border-[#2A2F3C] bg-[#232836] px-3 py-2 text-center text-[11px] font-semibold text-white">
                  Trắc nghiệm: {completedSubmission.mcq_score} đ - Tự luận:{" "}
                  {!hasEssay
                    ? "0 đ"
                    : completedSubmission.status === "graded" && completedSubmission.essay_score !== null
                    ? `${completedSubmission.essay_score} đ`
                    : "Đang chờ chấm"}
                </div>
              </div>

              {aiGradingState.isGrading && (
                <p className="mb-4 text-[11px] text-[#9CA3AF]">
                  {aiGradingState.statusText}
                </p>
              )}

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/history")}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-[#05070D] shadow-lg transition cursor-pointer"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Đến Lịch sử làm bài</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/history/${completedSubmission.id}`)
                  }
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#10131B] border border-[#2A2F3C] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#161A24] cursor-pointer"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
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
        />
      )}
    </div>
  );
}
