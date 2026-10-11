"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  getBookmarks,
  removeBookmark,
  getCurrentUser,
  getExams,
} from "@/lib/store";
import { UserBookmark, Exam } from "@/types/exam";
import { formatDate, cn } from "@/lib/utils";
import {
  Bookmark,
  BookmarkX,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Play,
  RotateCcw,
  HelpCircle,
  X,
  Filter,
  Check,
} from "lucide-react";

export default function BookmarksPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [bookmarks, setBookmarks] = useState<UserBookmark[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Interactive quick practice state
  const [practicingQuestionId, setPracticingQuestionId] = useState<string | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState<string>("");
  const [hasCheckedPractice, setHasCheckedPractice] = useState<boolean>(false);

  // Expanded explanations
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }

    async function loadData() {
      try {
        const [bmData, examData] = await Promise.all([
          getBookmarks(user?.id),
          getExams(true, user?.id),
        ]);
        setBookmarks(bmData);
        setExams(examData);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Remove a bookmark
  const handleRemoveBookmark = async (questionId: string) => {
    const user = getCurrentUser();
    if (!user) return;

    setBookmarks((prev) => prev.filter((b) => b.question_id !== questionId));
    try {
      await removeBookmark(user.id, questionId);
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
    }
  };

  const toggleSolution = (questionId: string) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Filtered list
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bm) => {
      const q = bm.question;
      if (!q) return false;

      // Filter by exam
      if (selectedExamId !== "all" && bm.exam_id !== selectedExamId) {
        return false;
      }

      // Filter by question type
      if (selectedType !== "all" && q.type !== selectedType) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const contentMatch = q.content.toLowerCase().includes(query);
        const examMatch = (bm.exam?.title || "").toLowerCase().includes(query);
        const optionsMatch = q.options.some((opt) => opt.toLowerCase().includes(query));
        return contentMatch || examMatch || optionsMatch;
      }

      return true;
    });
  }, [bookmarks, selectedExamId, selectedType, searchQuery]);

  // Unique exams from bookmarks
  const availableExams = useMemo(() => {
    const examMap = new Map<string, string>();
    bookmarks.forEach((b) => {
      if (b.exam_id && b.exam?.title) {
        examMap.set(b.exam_id, b.exam.title);
      } else if (b.exam_id) {
        const found = exams.find((e) => e.id === b.exam_id);
        if (found) examMap.set(b.exam_id, found.title);
      }
    });
    return Array.from(examMap.entries()).map(([id, title]) => ({ id, title }));
  }, [bookmarks, exams]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Bookmark className="h-5 w-5 fill-current" />
            </span>
            <span>Các câu hỏi đã đánh dấu</span>
            <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-normal">
              {bookmarks.length} câu đã lưu
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Kho lưu trữ các câu hỏi trọng tâm bạn đã lưu lại trong lúc làm bài thi hoặc khi xem lại kết quả. Dễ dàng ôn tập, tra cứu lời giải và luyện tập củng cố kiến thức.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-slate-900/60 backdrop-blur-md hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 self-start md:self-auto"
        >
          <BookOpen className="h-4 w-4 text-indigo-400" />
          <span>Về danh sách đề thi</span>
        </Link>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center gap-3"
      >
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo nội dung câu hỏi, từ khóa, đáp án..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter by Exam */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:block shrink-0" />
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60 transition-all cursor-pointer"
          >
            <option value="all">Tất cả đề thi ({bookmarks.length})</option>
            {availableExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Type */}
        <div className="flex rounded-xl bg-slate-900/80 border border-white/10 p-1">
          <button
            onClick={() => setSelectedType("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              selectedType === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => setSelectedType("multiple_choice")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              selectedType === "multiple_choice"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Trắc nghiệm
          </button>
          <button
            onClick={() => setSelectedType("essay")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              selectedType === "essay"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            Tự luận
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 flex h-64 items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-sm text-slate-400">Đang tải các câu hỏi đã đánh dấu...</p>
          </div>
        </div>
      ) : bookmarks.length === 0 ? (
        /* Empty State: No Bookmarks at all */
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-950/60 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center rounded-2xl py-16 px-6 text-center shadow-xl space-y-4"
        >
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.2)]">
            <Bookmark className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-white">Chưa có câu hỏi nào được đánh dấu</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Trong lúc làm bài thi hoặc khi xem lại kết quả bài nộp, bạn hãy nhấn vào biểu tượng <strong>Đánh dấu</strong> để lưu các câu hỏi hay hoặc câu cần ôn tập vào đây.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all"
          >
            <BookOpen className="h-4 w-4" />
            <span>Khám phá Đề thi thử</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      ) : filteredBookmarks.length === 0 ? (
        /* Empty State: Filter matched 0 */
        <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center space-y-3">
          <HelpCircle className="h-10 w-10 text-slate-500" />
          <h3 className="text-base font-bold text-white">Không tìm thấy câu hỏi phù hợp</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Không có câu hỏi nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại của bạn.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedExamId("all");
              setSelectedType("all");
            }}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>
      ) : (
        /* Question Cards List */
        <div className="space-y-6">
          {filteredBookmarks.map((bookmark, index) => {
            const q = bookmark.question;
            if (!q) return null;

            const isMCQ = q.type === "multiple_choice";
            const isPracticing = practicingQuestionId === q.id;
            const isSolutionOpen = Boolean(expandedSolutions[q.id]);

            return (
              <motion.article
                key={bookmark.id}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(index * 0.04, 0.2),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)] space-y-5"
              >
                {/* Card Top: Badges & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Index badge */}
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-xs font-bold text-indigo-400">
                      {index + 1}
                    </span>

                    {/* Original Exam Title Badge */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20 max-w-xs sm:max-w-md truncate">
                      <BookOpen className="h-3 w-3 text-indigo-400 shrink-0" />
                      <span className="truncate">{bookmark.exam?.title || "Đề thi thử"}</span>
                    </span>

                    {/* Type Badge */}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold border",
                        isMCQ
                          ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                          : "bg-violet-500/10 text-violet-300 border-violet-500/20"
                      )}
                    >
                      {isMCQ ? "Trắc nghiệm" : "Tự luận"}
                    </span>

                    {/* Max score badge */}
                    <span className="rounded-full bg-slate-900 border border-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                      Điểm: {q.max_score}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Saved timestamp */}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>Đã lưu: {formatDate(bookmark.created_at)}</span>
                    </span>

                    {/* Unbookmark button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveBookmark(bookmark.question_id)}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer"
                      title="Bỏ câu hỏi này khỏi danh sách đánh dấu"
                    >
                      <BookmarkX className="h-3.5 w-3.5" />
                      <span>Bỏ đánh dấu</span>
                    </button>
                  </div>
                </div>

                {/* Question Content */}
                <div className="space-y-3">
                  <p className="whitespace-pre-wrap text-sm sm:text-base font-medium leading-relaxed text-slate-100">
                    {q.content}
                  </p>
                </div>

                {/* Multiple Choice Options Display */}
                {isMCQ && q.options && q.options.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Danh sách các đáp án lựa chọn:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((optText, optIdx) => {
                        const letterMatch = optText.match(/^([A-Z])[\.\:\)]/i);
                        const letter = letterMatch
                          ? letterMatch[1].toUpperCase()
                          : String.fromCharCode(65 + optIdx);
                        const correctKeyLetter = (q.correct_answer || "")
                          .replace(/^([A-Z])[\.\:\)].*/i, "$1")
                          .trim()
                          .toUpperCase();
                        const isCorrectAnswer =
                          correctKeyLetter.length > 0 && correctKeyLetter === letter;

                        // Practice mode selection
                        const isSelectedInPractice = isPracticing && practiceAnswer === letter;

                        let cardStyle =
                          "border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-slate-700";
                        let badgeStyle = "border-slate-700 bg-slate-800 text-slate-400";

                        if (isPracticing) {
                          if (isSelectedInPractice) {
                            cardStyle = hasCheckedPractice
                              ? isCorrectAnswer
                                ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/40"
                                : "border-rose-500/60 bg-rose-950/40 text-rose-300 ring-1 ring-rose-500/40"
                              : "border-indigo-500/60 bg-indigo-950/40 text-indigo-200 ring-1 ring-indigo-500/40";
                            badgeStyle = hasCheckedPractice
                              ? isCorrectAnswer
                                ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                                : "border-rose-400/50 bg-rose-500/20 text-rose-300"
                              : "border-indigo-400/50 bg-indigo-500/30 text-white";
                          } else if (hasCheckedPractice && isCorrectAnswer) {
                            cardStyle =
                              "border-emerald-500/50 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/30";
                            badgeStyle =
                              "border-emerald-400/50 bg-emerald-500/20 text-emerald-300";
                          }
                        } else if (isCorrectAnswer) {
                          cardStyle =
                            "border-emerald-500/50 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                          badgeStyle =
                            "border-emerald-400/50 bg-emerald-500/20 text-emerald-300 font-bold";
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => {
                              if (isPracticing && !hasCheckedPractice) {
                                setPracticeAnswer(letter);
                              }
                            }}
                            className={cn(
                              "flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs sm:text-sm leading-relaxed transition-all",
                              cardStyle,
                              isPracticing && !hasCheckedPractice && "cursor-pointer active:scale-[0.99]"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={cn(
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold border",
                                  badgeStyle
                                )}
                              >
                                {letter}
                              </span>
                              <span className="pt-0.5">
                                {optText.replace(/^[A-Z][\.\:\)]\s*/i, "")}
                              </span>
                            </div>

                            {/* Show correct answer pill when not in hidden practice mode */}
                            {(!isPracticing || hasCheckedPractice) && isCorrectAnswer && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Đáp án đúng</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Essay Question Notice */}
                {!isMCQ && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4 space-y-1.5">
                    <p className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Dạng bài Tự luận chuyên sâu</span>
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Câu hỏi yêu cầu trình bày lập luận, kiến trúc hoặc mã nguồn. Để làm và nộp bài để giáo viên/AI chấm điểm chi tiết, hãy vào phòng thi chứa câu hỏi này.
                    </p>
                  </div>
                )}

                {/* Detailed Solution / Explanation (Collapsible) */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleSolution(q.id)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl px-3 py-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isSolutionOpen ? "Ẩn lời giải chi tiết" : "Xem lời giải & Hướng dẫn"}</span>
                  </button>

                  <AnimatePresence>
                    {isSolutionOpen && (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="rounded-xl border border-white/10 bg-slate-900/80 p-4 space-y-2 text-xs text-slate-300 leading-relaxed">
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>
                              Đáp án chuẩn:{" "}
                              <strong className="text-emerald-400">
                                {q.correct_answer || "Theo barem đề thi"}
                              </strong>
                            </span>
                          </p>
                          <div className="text-slate-300 whitespace-pre-wrap">
                            {q.explanation ? (
                              q.explanation
                            ) : (
                              <p>
                                Đáp án chính xác là <strong>{q.correct_answer}</strong>. Bạn hãy đối chiếu với định nghĩa lý thuyết và tài liệu bài giảng tương ứng để ghi nhớ bản chất kiến thức.
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Card Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                  {/* Left: Quick Practice Buttons */}
                  <div className="flex items-center gap-2">
                    {isMCQ && (
                      <>
                        {!isPracticing ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPracticingQuestionId(q.id);
                              setPracticeAnswer("");
                              setHasCheckedPractice(false);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition-all hover:border-indigo-500/40"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Luyện tập lại câu này</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            {!hasCheckedPractice ? (
                              <button
                                type="button"
                                disabled={!practiceAnswer}
                                onClick={() => setHasCheckedPractice(true)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                                  practiceAnswer
                                    ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-500"
                                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                                )}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Kiểm tra đáp án</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setPracticeAnswer("");
                                  setHasCheckedPractice(false);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-indigo-300 hover:text-white"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Thử lại</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setPracticingQuestionId(null);
                                setPracticeAnswer("");
                                setHasCheckedPractice(false);
                              }}
                              className="text-xs text-slate-400 hover:text-white px-2 py-1"
                            >
                              Thoát
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right: Navigate to Exam button */}
                  <Link
                    href={`/exam/${bookmark.exam_id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:from-indigo-500 hover:to-violet-500 transition-all active:scale-[0.98]"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Đến đề thi chứa câu này</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
