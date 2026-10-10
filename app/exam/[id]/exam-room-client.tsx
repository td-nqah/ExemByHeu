"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getExamById, submitExam, finalizeGrading, getCurrentUser } from "@/lib/store";
import { Exam } from "@/types/exam";
import { StickyTimer } from "@/components/exam/StickyTimer";
import { QuestionNav } from "@/components/exam/QuestionNav";
import { SubmitConfirmModal } from "@/components/exam/SubmitConfirmModal";
import { Send, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export function ExamRoomClient({ examId }: { examId: string }) {
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    try {
      const submission = await submitExam(examId, userAnswers);
      const essayQuestions = (exam?.questions || []).filter((q) => q.type === "essay");

      if (essayQuestions.length > 0) {
        setAiGradingState({
          isGrading: true,
          statusText: "Gemini AI đang chấm điểm các câu tự luận của bạn trong vòng vài giây...",
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
              await finalizeGrading(submission.id, data.results);
            }
          }
        } catch (e) {
          console.warn("Lỗi AI chấm nhanh:", e);
        }

        setAiGradingState({
          isGrading: true,
          statusText: "Đã hoàn thành chấm điểm! Đang mở bảng kết quả...",
        });
      }

      router.push(`/exam/${examId}/result?submissionId=${submission.id}`);
    } catch (err: any) {
      alert("Lỗi khi nộp bài: " + (err?.message || "Vui lòng thử lại"));
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setAiGradingState({ isGrading: false, statusText: "" });
    }
  }, [examId, exam, userAnswers, isSubmitting, router]);

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
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-zinc-300">
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
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <h2 className="text-base font-bold text-white">Không tìm thấy bài thi</h2>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-xs font-semibold text-emerald-400 underline"
          >
            Quay lại Bảng điều khiển
          </Link>
        </div>
      </div>
    );
  }

  const questions = exam.questions;
  const answeredCount = questions.filter((q) => (userAnswers[q.id] || "").trim().length > 0).length;

  return (
    <div className="min-h-[100dvh] pb-20">
      <header className="glass-nav sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="glass-pill rounded-xl p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="hidden sm:block">
              <h1 className="line-clamp-1 text-sm font-bold text-white">
                {exam.title}
              </h1>
              <p className="text-[11px] text-zinc-400">
                Thí sinh: {getCurrentUser()?.username || "Thí sinh"} • Tổng {questions.length} câu hỏi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StickyTimer
              durationMinutes={exam.duration_minutes}
              onTimeUp={handlePerformSubmit}
            />

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Nộp bài ({answeredCount}/{questions.length})</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-20 space-y-4">
              <QuestionNav
                questions={questions}
                userAnswers={userAnswers}
                activeQuestionId={activeQuestionId}
                onSelectQuestion={scrollToQuestion}
              />

              <div className="glass-card rounded-2xl p-4 text-xs text-zinc-300">
                <p className="mb-1.5 font-bold text-white">Quy định phòng thi thử:</p>
                <ul className="list-disc space-y-1 pl-4 text-[11px] text-zinc-400">
                  <li>Điểm trắc nghiệm được chấm tự động ngay khi nộp bài.</li>
                  <li>Câu hỏi tự luận được Gemini AI chấm ngay trên thang điểm 5.</li>
                  <li>Khi hết thời gian, hệ thống tự động khóa và gửi bài làm.</li>
                </ul>
              </div>
            </div>
          </aside>

          <main className="space-y-6 lg:col-span-8 xl:col-span-9">
            {questions.map((question, index) => {
              const currentVal = userAnswers[question.id] || "";
              const isAnswered = currentVal.trim().length > 0;

              return (
                <article
                  key={question.id}
                  id={`q_${question.id}`}
                  onClick={() => setActiveQuestionId(question.id)}
                  className={`glass-card scroll-mt-24 rounded-2xl p-6 transition ${
                    activeQuestionId === question.id
                      ? "border-emerald-500/50 ring-1 ring-emerald-500/30"
                      : "hover:border-white/20"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-xs font-bold text-emerald-400">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {question.type === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="glass-pill rounded-md px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                        Điểm tối đa: {question.max_score}
                      </span>
                      {isAnswered ? (
                        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                          Đã làm
                        </span>
                      ) : (
                        <span className="glass-pill rounded-md px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
                          Chưa làm
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mb-5 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-100">
                    {question.content}
                  </p>

                  {question.type === "multiple_choice" ? (
                    <div className="space-y-2.5">
                      {question.options.map((optText, optIdx) => {
                        const letterMatch = optText.match(/^([A-D])[\.\:\)]/i);
                        const letter = letterMatch
                          ? letterMatch[1].toUpperCase()
                          : String.fromCharCode(65 + optIdx);
                        const isSelected = currentVal === letter;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectMCQ(question.id, optText)}
                            className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-xs transition ${
                              isSelected
                                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/40"
                                : "border-white/10 bg-zinc-950/55 text-zinc-200 hover:border-white/20 hover:bg-zinc-900/70"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                                isSelected
                                  ? "bg-emerald-500 text-zinc-950"
                                  : "border border-white/15 bg-zinc-900 text-zinc-300"
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{optText}</span>
                          </button>
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
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>
                          Số từ: {currentVal.trim() ? currentVal.trim().split(/\s+/).length : 0} từ
                        </span>
                        <span>{currentVal.length} ký tự</span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            <div className="glass-panel flex flex-col items-center justify-between gap-4 rounded-2xl p-6 sm:flex-row">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Hoàn thành bài làm của bạn?
                </h4>
                <p className="text-xs text-zinc-400">
                  Bạn đã trả lời {answeredCount} trên tổng số {questions.length} câu hỏi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500 px-6 py-3 text-xs font-bold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-emerald-400 active:scale-[0.98] sm:w-auto"
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

      {/* AI Fast Grading Modal */}
      {aiGradingState.isGrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
              <Sparkles className="h-7 w-7 animate-spin text-emerald-400" />
            </div>

            <h3 className="text-base font-bold text-white">
              Gemini AI Đang Chấm Điểm Tự Luận
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-300">
              {aiGradingState.statusText}
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-400">
              <div className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
              <span>Hoàn tất trong vòng dưới 30 giây</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
