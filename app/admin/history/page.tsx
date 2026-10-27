"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSubmissions,
  getSubmissionById,
  getCurrentUser,
  getAllProfiles,
  getExams,
} from "@/lib/store";
import { Submission, Profile, Exam } from "@/types/exam";
import { formatDate, cn } from "@/lib/utils";
import {
  History,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  X,
  FileText,
  Award,
  AlertCircle,
  Sparkles,
  BookOpen,
  Filter,
  Check,
  ChevronDown,
  Layers,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PopoverSelect } from "@/components/ui/PopoverSelect";

export default function AdminHistoryPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // Data states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "graded" | "pending_grading">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "score_high" | "score_low">("newest");

  // Quick-view Modal State
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [detailSubmission, setDetailSubmission] = useState<Submission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Authentication & Initial load
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    loadAllData();
  }, [router]);

  async function loadAllData() {
    try {
      const [allSubs, allProfs, allExs] = await Promise.all([
        getSubmissions(undefined, 200),
        getAllProfiles(),
        getExams(),
      ]);
      setSubmissions(allSubs);
      setProfiles(allProfs);
      setExams(allExs);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
  };

  // Open Quick View Modal
  const handleOpenDetail = async (subId: string) => {
    setViewingId(subId);
    setDetailLoading(true);
    try {
      const fullSub = await getSubmissionById(subId);
      setDetailSubmission(fullSub);
    } catch {
      setDetailSubmission(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setViewingId(null);
    setDetailSubmission(null);
  };

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = submissions.length;
    const uniqueUserIds = new Set(submissions.map((s) => s.user_id || s.user?.username));
    const uniqueUsersCount = uniqueUserIds.size;
    const pendingCount = submissions.filter((s) => s.status === "pending_grading").length;
    const gradedCount = submissions.filter((s) => s.status === "graded").length;

    const totalScoresSum = submissions.reduce((sum, s) => sum + (Number(s.total_score) || 0), 0);
    const avgScore = totalCount > 0 ? (totalScoresSum / totalCount).toFixed(1) : "0.0";

    return {
      totalCount,
      uniqueUsersCount,
      pendingCount,
      gradedCount,
      avgScore,
    };
  }, [submissions]);

  // Account options for filtering
  const accountOptions = useMemo(() => {
    // Count submissions per username
    const counts: Record<string, number> = {};
    for (const sub of submissions) {
      const uname = (sub.user?.username || sub.user_id || "Khác").toLowerCase();
      counts[uname] = (counts[uname] || 0) + 1;
    }

    // Merge system profiles
    const userMap = new Map<string, { label: string; count: number }>();
    for (const p of profiles) {
      const uname = p.username.toLowerCase();
      userMap.set(uname, {
        label: p.username,
        count: counts[uname] || 0,
      });
    }

    // Include any users found in submissions that aren't in profiles
    for (const sub of submissions) {
      const uname = (sub.user?.username || sub.user_id || "khác").toLowerCase();
      if (!userMap.has(uname)) {
        userMap.set(uname, {
          label: sub.user?.username || sub.user_id || "Học viên",
          count: counts[uname] || 0,
        });
      }
    }

    return Array.from(userMap.entries()).map(([val, info]) => ({
      value: val,
      label: info.label,
      count: info.count,
    }));
  }, [submissions, profiles]);

  // Filtered & Sorted Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((sub) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const username = (sub.user?.username || "").toLowerCase();
          const examTitle = (sub.exam?.title || "").toLowerCase();
          if (!username.includes(q) && !examTitle.includes(q)) {
            return false;
          }
        }

        // Account filter
        if (selectedUser !== "all") {
          const subUser = (sub.user?.username || sub.user_id || "").toLowerCase();
          if (subUser !== selectedUser.toLowerCase()) {
            return false;
          }
        }

        // Exam filter
        if (selectedExam !== "all") {
          if (sub.exam_id !== selectedExam) {
            return false;
          }
        }

        // Status filter
        if (selectedStatus !== "all") {
          if (sub.status !== selectedStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        }
        if (sortBy === "score_high") {
          return (Number(b.total_score) || 0) - (Number(a.total_score) || 0);
        }
        if (sortBy === "score_low") {
          return (Number(a.total_score) || 0) - (Number(b.total_score) || 0);
        }
        return 0;
      });
  }, [submissions, searchQuery, selectedUser, selectedExam, selectedStatus, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedUser !== "all" ||
    selectedExam !== "all" ||
    selectedStatus !== "all" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedUser("all");
    setSelectedExam("all");
    setSelectedStatus("all");
    setSortBy("newest");
  };

  // Helper for performance badge
  const renderScoreBadge = (score: number) => {
    if (score >= 9.0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          Xuất sắc
        </span>
      );
    }
    if (score >= 8.0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
          Giỏi
        </span>
      );
    }
    if (score >= 6.5) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
          Khá
        </span>
      );
    }
    if (score >= 5.0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Trung bình
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        Dưới TB
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* 1. Header Section */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs bg-[#10131B] text-[#9CA3AF] border border-[#252A37] px-3 py-1 rounded-full font-medium">
              Quản lý hệ thống
            </span>
            <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full font-medium">
              Khảo thí &amp; Đánh giá
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Lịch sử Đánh giá của các Tài khoản
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
            Xem điểm số, phân tích kết quả và kiểm tra chi tiết bài làm của từng tài khoản học viên trong toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full bg-[#10131B] hover:bg-[#161A24] border border-[#252A37] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-white", refreshing && "animate-spin")} />
            <span>{refreshing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}</span>
          </button>
        </div>
      </motion.div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng số bài làm */}
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#8B93A5]">
              Tổng bài nộp
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10131B] border border-[#252A37] text-white">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
            {stats.totalCount}
          </div>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Lượt thi được ghi nhận</p>
        </div>

        {/* Card 2: Tài khoản tham gia */}
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#8B93A5]">
              Tài khoản thi
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10131B] border border-[#252A37] text-white">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
            {stats.uniqueUsersCount}
          </div>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Thí sinh có bài làm</p>
        </div>

        {/* Card 3: Điểm trung bình */}
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#8B93A5]">
              Điểm trung bình
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10131B] border border-[#252A37] text-white">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
            {stats.avgScore} <span className="text-xs text-[#9CA3AF] font-normal">/ 10</span>
          </div>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Toàn bộ bài đánh giá</p>
        </div>

        {/* Card 4: Chờ chấm tự luận */}
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#8B93A5]">
              Chờ chấm tự luận
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10131B] border border-[#252A37] text-white">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight tabular-nums">
            {stats.pendingCount}
          </div>
          <p className="mt-1 text-[11px] text-[#9CA3AF]">Bài thi cần hoàn thiện điểm</p>
        </div>
      </div>

      {/* 3. Filter & Toolbar */}
      <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-4 sm:p-5 shadow-xl space-y-4">
        {/* Row 1: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="lg:col-span-5 relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#8B93A5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên tài khoản hoặc tên đề thi..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#10131B] border border-[#252A37] rounded-full text-xs text-white placeholder-[#8B93A5] focus:outline-none focus:border-white/50 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3 text-[#8B93A5] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Account Filter */}
          <div className="lg:col-span-3">
            <PopoverSelect<string>
              className="w-full"
              buttonClassName="w-full py-2.5"
              menuClassName="w-full sm:min-w-[260px]"
              value={selectedUser}
              onChange={(val) => setSelectedUser(val)}
              options={[
                {
                  value: "all",
                  label: "Tất cả tài khoản",
                  badge: accountOptions.length,
                },
                ...accountOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                  badge: `${opt.count} bài`,
                })),
              ]}
            />
          </div>

          {/* Exam Filter */}
          <div className="lg:col-span-4">
            <PopoverSelect<string>
              className="w-full"
              buttonClassName="w-full py-2.5"
              menuClassName="w-full sm:min-w-[320px] max-w-md"
              value={selectedExam}
              onChange={(val) => setSelectedExam(val)}
              options={[
                {
                  value: "all",
                  label: "Tất cả đề đánh giá",
                  badge: exams.length,
                },
                ...exams.map((ex) => ({
                  value: ex.id,
                  label: ex.title,
                  description: ex.duration_minutes ? `${ex.duration_minutes} phút` : undefined,
                })),
              ]}
            />
          </div>
        </div>

        {/* Row 2: Status Pills & Sort Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#252A37]">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#10131B] p-1 rounded-full border border-[#252A37] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedStatus("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                selectedStatus === "all"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-[#8B93A5] hover:text-white"
              }`}
            >
              Tất cả ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("graded")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                selectedStatus === "graded"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-[#8B93A5] hover:text-white"
              }`}
            >
              Đã hoàn tất ({stats.gradedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("pending_grading")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                selectedStatus === "pending_grading"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-[#8B93A5] hover:text-white"
              }`}
            >
              Chờ chấm tự luận ({stats.pendingCount})
            </button>
          </div>

          {/* Sort & Reset */}
          <div className="flex items-center gap-2">
            <PopoverSelect<"newest" | "oldest" | "score_high" | "score_low">
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              align="right"
              buttonClassName="py-1.5"
              options={[
                { value: "newest", label: "Mới nhất trước" },
                { value: "oldest", label: "Cũ nhất trước" },
                { value: "score_high", label: "Điểm cao nhất" },
                { value: "score_low", label: "Điểm thấp nhất" },
              ]}
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-full text-xs text-[#9CA3AF] hover:text-white hover:bg-[#10131B] border border-transparent hover:border-[#252A37] transition cursor-pointer"
              >
                Đặt lại
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Submissions Data Table */}
      <div className="rounded-3xl border border-[#252A37] bg-[#161A24] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between border-b border-[#252A37] p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <History className="h-4 w-4 text-white" />
            <h2 className="text-sm font-bold text-white">
              Danh sách Bài làm &amp; Điểm số
            </h2>
            <span className="rounded-full bg-[#10131B] border border-[#252A37] px-3 py-0.5 text-xs font-semibold tabular-nums text-white">
              {filteredSubmissions.length} kết quả
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex h-44 items-center justify-center">
            <div className="flex items-center gap-2.5 text-xs text-[#9CA3AF]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Đang tải lịch sử bài đánh giá...</span>
            </div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10131B] border border-[#252A37] text-white mx-auto shadow-sm">
              <History className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-white">
              Không tìm thấy bài làm nào
            </p>
            <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
              {hasActiveFilters
                ? "Không có bài nộp nào phù hợp với bộ lọc hiện tại. Vui lòng thử thay đổi từ khóa hoặc đặt lại bộ lọc."
                : "Chưa có tài khoản nào thực hiện bài đánh giá trong hệ thống."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-200 text-black px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#10131B] text-[#8B93A5] uppercase tracking-wide text-xs font-heading font-bold border-b border-[#252A37]">
                <tr>
                  <th className="py-3.5 px-3 font-bold w-12 text-center">#</th>
                  <th className="py-3.5 px-4 font-bold">Tài khoản thí sinh</th>
                  <th className="py-3.5 px-4 font-bold">Đề đánh giá</th>
                  <th className="py-3.5 px-4 font-bold">Thời gian nộp</th>
                  <th className="py-3.5 px-4 font-bold">Trạng thái</th>
                  <th className="py-3.5 px-4 font-bold">Trắc nghiệm</th>
                  <th className="py-3.5 px-4 font-bold">Tự luận</th>
                  <th className="py-3.5 px-4 font-bold">Tổng điểm</th>
                  <th className="py-3.5 px-4 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A37]">
                {filteredSubmissions.map((sub, idx) => {
                  const isGraded = sub.status === "graded";
                  const username = sub.user?.username || sub.user_id || "Thí sinh";
                  const isAdmin = sub.user?.role === "admin";
                  const totalScore = Number(sub.total_score) || 0;

                  return (
                    <tr
                      key={sub.id}
                      className={cn(
                        "transition-colors",
                        idx % 2 === 0 ? "bg-[#141824]" : "bg-[#161A24]",
                        "hover:bg-[#191E2B]"
                      )}
                    >
                      <td className="py-3.5 px-3 text-center font-bold tabular-nums text-[#8B93A5] text-xs">
                        #{idx + 1}
                      </td>

                      {/* Tài khoản thí sinh */}
                      <td className="whitespace-nowrap py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#10131B] border border-[#252A37] text-white font-bold text-xs select-none shrink-0 shadow-xs">
                            {username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span>{username}</span>
                              {isAdmin && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                                  Admin
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#8B93A5]">
                              {isAdmin ? "Quản trị viên" : "Sinh viên / Học viên"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Đề đánh giá */}
                      <td className="py-3.5 px-4 font-medium text-slate-200 max-w-xs">
                        <p className="truncate font-semibold text-white">
                          {sub.exam?.title || "Đề đánh giá"}
                        </p>
                        {sub.exam?.duration_minutes && (
                          <p className="text-[11px] text-[#8B93A5] mt-0.5">
                            Thời gian: {sub.exam.duration_minutes} phút
                          </p>
                        )}
                      </td>

                      {/* Thời gian nộp */}
                      <td className="whitespace-nowrap py-3.5 px-4 text-[#9CA3AF] tabular-nums">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#8B93A5]" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="whitespace-nowrap py-3.5 px-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            Đã hoàn tất
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 text-[11px] font-semibold">
                            <Clock className="h-3 w-3 text-amber-400" />
                            Chờ chấm tự luận
                          </span>
                        )}
                      </td>

                      {/* Điểm trắc nghiệm */}
                      <td className="py-3.5 px-4 font-semibold text-slate-200 tabular-nums">
                        {sub.mcq_score} đ
                      </td>

                      {/* Điểm tự luận */}
                      <td className="py-3.5 px-4 text-slate-300 tabular-nums">
                        {sub.essay_score !== null ? `${sub.essay_score} đ` : (
                          <span className="text-amber-400/90 italic">Chờ chấm</span>
                        )}
                      </td>

                      {/* Tổng điểm */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white tabular-nums">
                            {totalScore}
                          </span>
                          {renderScoreBadge(totalScore)}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="whitespace-nowrap py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(sub.id)}
                            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#10131B] hover:bg-[#161A24] text-white border border-[#252A37] transition shadow-xs cursor-pointer active:scale-95"
                          >
                            <Eye className="h-3.5 w-3.5 text-white" />
                            <span>Xem bài làm</span>
                          </button>

                          {!isGraded ? (
                            <Link
                              href={`/admin/submissions/${sub.id}`}
                              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold bg-white hover:bg-slate-200 text-[#05070D] transition shadow-sm cursor-pointer active:scale-95"
                            >
                              <span>Chấm bài</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/submissions/${sub.id}`}
                              title="Cập nhật điểm hoặc nhận xét"
                              className="p-1.5 rounded-full text-[#9CA3AF] hover:text-white hover:bg-[#10131B] transition cursor-pointer"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Quick-View Detailed Submission Modal */}
      <AnimatePresence>
        {viewingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-[#252A37] bg-[#161A24] shadow-2xl overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#252A37] shrink-0 bg-[#161A24]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#10131B] border border-[#252A37] text-white">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Chi tiết bài làm: {detailSubmission?.user?.username || "Thí sinh"}</span>
                    </h3>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      {detailSubmission?.exam?.title || "Đề thi đánh giá"} • Nộp lúc:{" "}
                      {detailSubmission?.submitted_at ? formatDate(detailSubmission.submitted_at) : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#9CA3AF] hover:text-white hover:bg-[#10131B] border border-transparent hover:border-[#252A37] transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                {detailLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <p className="text-xs text-[#9CA3AF]">Đang tải toàn bộ bài làm và câu trả lời...</p>
                  </div>
                ) : !detailSubmission ? (
                  <div className="py-12 text-center text-xs text-rose-400">
                    Không thể tải dữ liệu chi tiết bài làm.
                  </div>
                ) : (
                  <>
                    {/* Score Summary Box */}
                    <div className="rounded-2xl border border-[#252A37] bg-[#10131B] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center sm:text-left">
                          <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#8B93A5]">
                            Tổng điểm đạt được
                          </p>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-2xl font-black text-white tabular-nums">
                              {detailSubmission.total_score}
                            </span>
                            <span className="text-xs text-[#8B93A5]">điểm</span>
                          </div>
                        </div>

                        <div className="h-8 w-px bg-[#252A37] hidden sm:block" />

                        <div className="space-y-0.5 text-xs text-[#9CA3AF] tabular-nums">
                          <p>
                            Trắc nghiệm: <strong className="text-white">{detailSubmission.mcq_score} điểm</strong>
                          </p>
                          <p>
                            Tự luận:{" "}
                            <strong className="text-white">
                              {detailSubmission.essay_score !== null ? `${detailSubmission.essay_score} điểm` : "Chờ chấm"}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/submissions/${detailSubmission.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 transition shadow-sm cursor-pointer"
                        >
                          <span>Vào phòng chấm chi tiết</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                        <Link
                          href={`/history/${detailSubmission.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#161A24] text-white hover:bg-[#1E2330] border border-[#252A37] transition cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5 text-white" />
                          <span>Xem dạng học viên</span>
                        </Link>
                      </div>
                    </div>

                    {/* Answers Breakdown */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-[#8B93A5] flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-white" />
                        <span>Danh sách câu hỏi &amp; Bài làm của thí sinh</span>
                      </h4>

                      {(!detailSubmission.answers || detailSubmission.answers.length === 0) ? (
                        <p className="text-xs text-[#9CA3AF] italic">Không có dữ liệu chi tiết từng câu.</p>
                      ) : (
                        detailSubmission.answers.map((ans, idx) => {
                          const q = ans.question;
                          const isMCQ = q?.type === "multiple_choice";
                          const isCorrect = ans.is_correct;

                          return (
                            <div
                              key={ans.id || idx}
                              className="rounded-2xl border border-[#252A37] bg-[#10131B] p-4 sm:p-5 space-y-3"
                            >
                              {/* Question Header */}
                              <div className="flex items-center justify-between pb-2.5 border-b border-[#252A37]">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#161A24] border border-[#252A37] text-xs font-bold text-white tabular-nums">
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs font-semibold text-white">
                                    {isMCQ ? "Trắc nghiệm" : "Tự luận"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isMCQ ? (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                                        isCorrect
                                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                      }`}
                                    >
                                      {isCorrect ? `Đúng (+${ans.score_awarded} đ)` : "Sai (0 đ)"}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                      {ans.score_awarded !== null ? `${ans.score_awarded} đ` : "Chờ chấm"} / {q?.max_score || 5} đ
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Question Content */}
                              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                                {q?.content || "Nội dung câu hỏi"}
                              </p>

                              {/* MCQ Options Display */}
                              {isMCQ && q?.options && (
                                <div className="space-y-1.5 pt-1">
                                  {q.options.map((opt, optIdx) => {
                                    const optLabel = String.fromCharCode(65 + optIdx); // A, B, C, D
                                    const isChosen =
                                      ans.user_answer?.trim() === opt.trim() ||
                                      ans.user_answer?.trim() === optLabel;
                                    const isSystemCorrect =
                                      q.correct_answer?.trim() === opt.trim() ||
                                      q.correct_answer?.trim() === optLabel;

                                    let optClass = "border-[#252A37] bg-[#161A24] text-slate-300";
                                    if (isChosen && isSystemCorrect) {
                                      optClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-semibold";
                                    } else if (isChosen && !isSystemCorrect) {
                                      optClass = "border-rose-500/50 bg-rose-500/10 text-rose-300 font-semibold";
                                    } else if (isSystemCorrect) {
                                      optClass = "border-emerald-500/30 bg-emerald-500/5 text-emerald-400/90";
                                    }

                                    return (
                                      <div
                                        key={optIdx}
                                        className={cn(
                                          "flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs transition-colors",
                                          optClass
                                        )}
                                      >
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 font-bold text-[10px]">
                                          {optLabel}
                                        </span>
                                        <span className="flex-1">{opt}</span>
                                        {isChosen && (
                                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 shrink-0">
                                            Thí sinh chọn
                                          </span>
                                        )}
                                        {isSystemCorrect && !isChosen && (
                                          <span className="text-[10px] text-emerald-400 font-semibold shrink-0">
                                            Đáp án đúng
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Essay Answer Display */}
                              {!isMCQ && (
                                <div className="space-y-2 pt-1">
                                  <div className="rounded-xl border border-[#252A37] bg-[#161A24] p-3 text-xs text-white whitespace-pre-wrap leading-relaxed font-mono">
                                    {ans.user_answer ? ans.user_answer : <span className="text-slate-500 italic">Thí sinh để trống câu trả lời.</span>}
                                  </div>

                                  {ans.admin_feedback && (
                                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs space-y-1">
                                      <p className="font-bold text-indigo-300 flex items-center gap-1">
                                        <Sparkles className="h-3 w-3" />
                                        <span>Nhận xét đánh giá:</span>
                                      </p>
                                      <p className="text-slate-300 italic">{ans.admin_feedback}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Question Explanation if available */}
                              {q?.explanation && (
                                <div className="pt-2 text-[11px] text-[#8B93A5] border-t border-[#252A37]">
                                  <span className="font-bold text-white">Giải thích: </span>
                                  <span>{q.explanation}</span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#252A37] shrink-0 bg-[#161A24] flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-slate-200 transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}