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
      // 1. Lưu bài làm và chấm điểm trắc nghiệm tức thì
      const submission = await submitExam(examId, userAnswers);

      // 2. Kiểm tra nếu có câu hỏi tự luận, kích hoạt Gemini AI chấm ngay
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

      // 3. Chuyển sang trang xem kết quả
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
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
          <p className="mt-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Đang tải phòng thi an toàn...
          </p>
        </div>
      </div>
    );
  }

  if (!exam || !exam.questions) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center p-4">
        <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Không tìm thấy bài thi</h2>
        <Link href="/dashboard" className="mt-4 text-xs font-semibold text-zinc-900 underline">
          Quay lại Bảng điều khiển
        </Link>
      </div>
    );
  }

  const questions = exam.questions;
  const answeredCount = questions.filter((q) => (userAnswers[q.id] || "").trim().length > 0).length;

  return (
    <div className="min-h-[100dvh] bg-zinc-100/60 pb-20 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-zinc-900 line-clamp-1 dark:text-zinc-100">
                {exam.title}
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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

              <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Quy định phòng thi:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Điểm trắc nghiệm được chấm tự động ngay khi nộp bài.</li>
                  <li>Câu hỏi tự luận sẽ do giáo viên xem xét và đánh giá.</li>
                  <li>Khi hết thời gian, hệ thống tự động khóa và gửi bài làm.</li>
                </ul>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 xl:col-span-9 space-y-6">
            {questions.map((question, index) => {
              const currentVal = userAnswers[question.id] || "";
              const isAnswered = currentVal.trim().length > 0;

              return (
                <article
                  key={question.id}
                  id={`q_${question.id}`}
                  onClick={() => setActiveQuestionId(question.id)}
                  className={`scroll-mt-24 rounded-2xl border bg-white p-6 shadow-xs transition dark:bg-zinc-900 ${
                    activeQuestionId === question.id
                      ? "border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {question.type === "multiple_choice" ? "Trắc nghiệm" : "Tự luận"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        Điểm tối đa: {question.max_score}
                      </span>
                      {isAnswered ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          Đã làm
                        </span>
                      ) : (
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          Chưa làm
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium leading-relaxed text-zinc-900 dark:text-zinc-100 mb-5 whitespace-pre-wrap">
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
                                ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-500"
                                : "border-zinc-200 bg-zinc-50/60 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                                isSelected
                                ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950"
                                : "border border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
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
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-xs leading-relaxed text-zinc-900 transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:bg-zinc-950"
                      />
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span>Số từ: {currentVal.trim() ? currentVal.trim().split(/\s+/).length : 0} từ</span>
                        <span>{currentVal.length} ký tự</span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Hoàn thành bài làm của bạn?
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Bạn đã trả lời {answeredCount} trên tổng số {questions.length} câu hỏi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-purple-200 bg-white p-6 shadow-2xl dark:border-purple-900/60 dark:bg-zinc-900 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 mb-4 shadow-xs">
              <Sparkles className="h-7 w-7 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Gemini AI Đang Chấm Điểm Tự Luận
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              {aiGradingState.statusText}
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
              <div className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
              <span>Hoàn tất trong vòng dưới 30 giây</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
