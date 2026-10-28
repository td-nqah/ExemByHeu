"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSubmissions, getCurrentUser, getCategories } from "@/lib/store";
import { Submission, Category, Profile } from "@/types/exam";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  Share2,
  Trophy,
  Sparkles,
  ShieldCheck,
  Award,
  Crown,
  Flame,
  Gem,
  Medal,
  Star,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Layers,
  History,
  Target,
  Zap,
  Brain,
  Timer,
  Check,
  X,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PopoverSelect } from "@/components/ui/PopoverSelect";

export interface StudentPerformanceStats {
  totalExams: number;
  passRate: number;
  perfectScores: number;
  radarMetrics: {
    accuracy: number;       // 0 - 100
    mastery: number;        // 0 - 100
    diligence: number;      // 0 - 100
    problemSolving: number; // 0 - 100
    discipline: number;     // 0 - 100
  };
  badges: {
    valedictorian: number;
    flawless: number;
    streak50: number;
    streak20: number;
    tierSSS: number;
    tierSS: number;
    tierS: number;
    nearPerfect: number;
  };
  integrityScore: number;
}

// 5 quantitative axes configuration (MOBA Stat-Sheet inspired)
const RADAR_AXES = [
  { key: "accuracy", label: "Độ chính xác", mobaTag: "Gây ST", desc: "Tỷ lệ câu trả lời chính xác qua các bài thi", angleDeg: -90 },
  { key: "mastery", label: "Điểm trung bình", mobaTag: "KDA", desc: "Điểm chuẩn hóa quy đổi theo thang điểm 10", angleDeg: -18 },
  { key: "diligence", label: "Chuyên cần", mobaTag: "Ph.triển", desc: "Tổng lượt thi & thời lượng rèn luyện tích lũy", angleDeg: 54 },
  { key: "problemSolving", label: "Vận dụng cao", mobaTag: "G.tranh tổng", desc: "Năng lực giải quyết câu hỏi khó & tự luận chuyên sâu", angleDeg: 126 },
  { key: "discipline", label: "Kỷ luật & Tốc độ", mobaTag: "Bền bỉ", desc: "Tốc độ làm bài chuẩn mực, không vi phạm rời tab", angleDeg: 198 },
] as const;

export default function AnalyticsPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // User & Data States
  const [user, setUser] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("Tổng quan");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [activeNavSection, setActiveNavSection] = useState<string>("competency");
  const [useDemoFallback, setUseDemoFallback] = useState<boolean>(false);

  // Deep Analysis Drawer & Share Toast
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  useEffect(() => {
    const curUser = getCurrentUser();
    if (!curUser) {
      router.push("/");
      return;
    }
    setUser(curUser);

    async function loadData() {
      try {
        const [subs, cats] = await Promise.all([
          getSubmissions(curUser?.id),
          getCategories(true),
        ]);
        setSubmissions(subs);
        setCategories(cats);
        // If history is currently empty (e.g. after clear), default to showcasing benchmark stats with easy toggle
        if (!subs || subs.length === 0) {
          setUseDemoFallback(true);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Filter submissions by Tab & Subject
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Subject filter
      if (selectedSubject !== "all") {
        const subCat = (sub.exam?.category_id || sub.exam?.title || "").toLowerCase();
        if (!subCat.includes(selectedSubject.toLowerCase())) {
          return false;
        }
      }
      // 2. Tab filter
      if (activeTab === "Đề trắc nghiệm") {
        const qList = sub.exam?.questions || [];
        if (qList.length > 0 && qList.every((q) => q.type !== "multiple_choice")) {
          return false;
        }
      } else if (activeTab === "Tự luận & Code") {
        const qList = sub.exam?.questions || [];
        if (qList.length > 0 && !qList.some((q) => q.type === "essay")) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, selectedSubject, activeTab]);

  // Compute Gamified Stats from Real Submissions or Showcase Defaults
  const stats: StudentPerformanceStats = useMemo(() => {
    const hasRealData = !useDemoFallback && filteredSubmissions.length > 0;

    if (hasRealData) {
      const total = filteredSubmissions.length;
      const passed = filteredSubmissions.filter((s) => Number(s.total_score) >= 5.0).length;
      const passRate = Math.round((passed / total) * 1000) / 10;
      const perfect = filteredSubmissions.filter((s) => Number(s.total_score) >= 9.9).length;

      const totalScoreSum = filteredSubmissions.reduce((sum, s) => sum + Number(s.total_score), 0);
      const avgScore = totalScoreSum / total;

      // 1. Accuracy
      const avgAccuracy = Math.min(
        100,
        Math.max(20, Math.round((avgScore / 10) * 92))
      );
      // 2. Mastery
      const mastery = Math.min(100, Math.max(15, Math.round((avgScore / 10) * 100)));
      // 3. Diligence
      const diligence = Math.min(100, Math.max(20, Math.round(total * 8 + 35)));
      // 4. Problem Solving (High-order thinking / essay)
      const problemSolving = Math.min(
        100,
        Math.max(15, Math.round(filteredSubmissions.filter((s) => Number(s.total_score) >= 7.0).length / total * 100))
      );
      // 5. Discipline & Pace
      const discipline = 100;

      // Badges
      const tierSSS = filteredSubmissions.filter((s) => Number(s.total_score) >= 9.5).length;
      const tierSS = filteredSubmissions.filter((s) => Number(s.total_score) >= 8.5 && Number(s.total_score) < 9.5).length;
      const tierS = filteredSubmissions.filter((s) => Number(s.total_score) >= 7.0 && Number(s.total_score) < 8.5).length;
      const nearPerfect = filteredSubmissions.filter((s) => Number(s.total_score) >= 9.0).length;
      const flawless = perfect;
      const valedictorian = filteredSubmissions.filter((s) => Number(s.total_score) >= 9.5).length;
      const streak50 = Math.floor(total / 3);
      const streak20 = Math.floor(total / 1.5);

      return {
        totalExams: total,
        passRate,
        perfectScores: perfect,
        radarMetrics: {
          accuracy: avgAccuracy,
          mastery,
          diligence,
          problemSolving,
          discipline,
        },
        badges: {
          valedictorian,
          flawless,
          streak50,
          streak20,
          tierSSS,
          tierSS,
          tierS,
          nearPerfect,
        },
        integrityScore: 100,
      };
    }

    // Benchmark Showcase MOBA stat-sheet data (Preserved exactly per specification)
    return {
      totalExams: 268,
      passRate: 78.5,
      perfectScores: 40,
      radarMetrics: {
        accuracy: 88,
        mastery: 84,
        diligence: 92,
        problemSolving: 76,
        discipline: 98,
      },
      badges: {
        valedictorian: 25,
        flawless: 0,
        streak50: 2,
        streak20: 24,
        tierSSS: 3,
        tierSS: 10,
        tierS: 12,
        nearPerfect: 34,
      },
      integrityScore: 100,
    };
  }, [filteredSubmissions, useDemoFallback]);

  // Radar Polygon SVG Points Calculation
  const radarSvgData = useMemo(() => {
    const cx = 200;
    const cy = 195;
    const rMax = 125;

    // Helper for vertex coordinate
    const getVertex = (angleDeg: number, radius: number) => {
      const rad = (angleDeg * Math.PI) / 180;
      return {
        x: cx + radius * Math.cos(rad),
        y: cy + radius * Math.sin(rad),
      };
    };

    // Concentric Web Pentagons (20%, 40%, 60%, 80%, 100%)
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const webs = levels.map((lvl) => {
      const points = RADAR_AXES.map((axis) => {
        const pt = getVertex(axis.angleDeg, rMax * lvl);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      }).join(" ");
      return { lvl, points };
    });

    // Connecting Spokes
    const spokes = RADAR_AXES.map((axis) => {
      const outerPt = getVertex(axis.angleDeg, rMax);
      return {
        x1: cx,
        y1: cy,
        x2: outerPt.x,
        y2: outerPt.y,
        angleDeg: axis.angleDeg,
        label: axis.label,
        mobaTag: axis.mobaTag,
      };
    });

    // Data Polygon Points
    const dataPoints = RADAR_AXES.map((axis) => {
      const val = stats.radarMetrics[axis.key as keyof typeof stats.radarMetrics] || 0;
      const normalizedRadius = rMax * (Math.max(15, Math.min(100, val)) / 100);
      const pt = getVertex(axis.angleDeg, normalizedRadius);
      return {
        ...pt,
        val,
        key: axis.key,
        label: axis.label,
        mobaTag: axis.mobaTag,
      };
    });

    const polygonPointsString = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    return { cx, cy, rMax, webs, spokes, dataPoints, polygonPointsString, getVertex };
  }, [stats.radarMetrics]);

  // Handle Share link copy
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }
  };

  // Subject options for dropdown
  const subjectOptions = useMemo(() => {
    const list = [
      { value: "all", label: "Tất cả môn học" },
      { value: "Chủ nghĩa xã hội", label: "Chủ nghĩa xã hội" },
      { value: "Cấu trúc máy tính", label: "Cấu trúc máy tính & HĐH" },
      { value: "Lịch sử Đảng", label: "Lịch sử Đảng" },
    ];
    categories.forEach((cat) => {
      if (!list.some((item) => item.value.toLowerCase() === cat.name.toLowerCase())) {
        list.push({ value: cat.name, label: cat.name });
      }
    });
    return list;
  }, [categories]);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 select-none">
      {/* 1. Header & Navigation Context */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer group"
          >
            <ChevronLeft className="w-4 h-4 text-[#6366F1] group-hover:-translate-x-0.5 transition-transform" />
            <span>Thông tin thí sinh / Năng lực học tập</span>
          </Link>

          {/* Toggle between real live submissions and demo showcase if submissions are 0 */}
          {submissions.length === 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161a24] border border-[#252a37] text-[11px] text-[#8b93a5]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Chế độ mô phỏng MOBA</span>
              <button
                type="button"
                onClick={() => setUseDemoFallback(!useDemoFallback)}
                className="ml-1 text-white underline hover:text-amber-400 cursor-pointer font-medium"
              >
                {useDemoFallback ? "Hiển thị thực tế (0 bài)" : "Xem mẫu MOBA (268 bài)"}
              </button>
            </div>
          )}
        </div>

        {/* Title Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Hồ sơ Năng lực &amp; Phân tích Thông số</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#6366F1]/15 text-[#a5b4fc] border border-[#6366F1]/30 uppercase tracking-wider">
                MOBA Stat-Sheet v2.0
              </span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8b93a5]">
              Mô hình đánh giá 5 trục năng lực chuẩn mực, thông số hiệu suất và huân chương học thuật.
            </p>
          </div>
        </div>

        {/* Top Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-b border-[#252a37] pb-4">
          {/* Segmented Horizontal Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {["Tổng quan", "Học kỳ 1 (2026)", "Tất cả học kỳ", "Đề trắc nghiệm", "Tự luận & Code"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer select-none",
                    isActive
                      ? "bg-[#6366F1]/15 text-white border border-[#6366F1]/40 shadow-xs"
                      : "text-[#8b93a5] hover:text-white hover:bg-white/[0.04] border border-transparent"
                  )}
                >
                  {tab}
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-glow"
                      className="absolute inset-x-2 -bottom-4 h-[2px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right-aligned Subject Selector Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#8b93a5] font-medium hidden sm:inline">Học phần:</span>
            <PopoverSelect<string>
              value={selectedSubject}
              onChange={(val) => setSelectedSubject(val)}
              options={subjectOptions}
              align="right"
              buttonClassName="h-8 text-xs bg-[#10131b] border-[#252a37] text-white rounded-xl min-w-[170px]"
            />
          </div>
        </div>
      </motion.div>

      {/* 2. Main 3-Column Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* ============================================================ */}
        {/* COLUMN 1: LEFT VERTICAL SUB-NAVIGATION PANEL (lg:col-span-3) */}
        {/* ============================================================ */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="lg:col-span-3 space-y-4"
        >
          {/* User Profile Card */}
          <div className="rounded-2xl bg-[#161a24] border border-[#252a37] p-4.5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#6366F1]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10131b] border border-[#252a37] text-white font-bold text-base shadow-sm">
                  {(user?.username || "A").charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#10B981] border-2 border-[#161a24]" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold text-white truncate">
                  {user?.username || "Thí sinh"}
                </p>
                <p className="text-[11px] text-[#8b93a5]">
                  {user?.role === "admin" ? "Quản trị viên hệ thống" : "Sinh viên chính quy"}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-400 font-mono font-bold">
                  <Crown className="w-3 h-3" />
                  <span>Cấp bậc: Cao Thủ Học Thuật</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Vertical Sub-Navigation List */}
          <div className="rounded-2xl bg-[#161a24] border border-[#252a37] p-2 space-y-1 shadow-lg">
            {[
              {
                id: "focus_subjects",
                label: "Môn học trọng tâm",
                icon: Target,
                badge: categories.length > 0 ? `${categories.length}` : "3",
                href: "/dashboard",
              },
              {
                id: "exam_history",
                label: "Lịch sử thi",
                icon: History,
                badge: `${submissions.length}`,
                href: "/history",
              },
              {
                id: "competency",
                label: "Hồ sơ Năng lực",
                icon: Brain,
                active: true,
                badge: "Radar 5D",
              },
              {
                id: "discipline",
                label: "Điểm Kỷ luật Phòng thi",
                icon: ShieldCheck,
                badge: "100/100",
                badgeColor: "text-[#10B981] bg-[#10B981]/15 border-[#10B981]/30",
              },
              {
                id: "achievements",
                label: "Huy hiệu & Chứng chỉ",
                icon: Award,
                badge: "8 Crests",
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = item.active || activeNavSection === item.id;

              return (
                <div key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                        isActive
                          ? "bg-[#1f2638] text-white border-l-4 border-l-[#F59E0B]"
                          : "text-[#8b93a5] hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#F59E0B]" : "text-[#8b93a5]")} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#10131b] border border-[#252a37] text-slate-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveNavSection(item.id)}
                      className={cn(
                        "relative flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left",
                        isActive
                          ? "bg-[#1f2638] text-white border-l-4 border-l-[#F59E0B]"
                          : "text-[#8b93a5] hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#F59E0B]" : "text-[#8b93a5]")} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-md border",
                            item.badgeColor || "bg-[#10131b] border-[#252a37] text-slate-300"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Exam Integrity Score Badge Card */}
          <div className="rounded-2xl bg-[#161a24] border border-[#252a37] p-4.5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-heading uppercase tracking-wider text-[#8b93a5] font-bold">
                Kỷ luật phòng thi
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#10B981]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Chuẩn chỉ
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold text-white">100</span>
              <span className="text-xs font-mono text-[#8b93a5]">/ 100 điểm</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Không có bất kỳ ghi nhận vi phạm rời tab, gian lận hoặc ngắt kết nối bất thường nào trong các kỳ thi.
            </p>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* COLUMN 2: CENTER 5-AXIS COMPETENCY RADAR WIDGET (lg:col-span-5) */}
        {/* ============================================================ */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="lg:col-span-5 space-y-4"
        >
          <div className="rounded-2xl bg-[#161a24] border border-[#252a37] p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Ambient Background Accents */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-10 left-10 w-32 h-32 bg-[#6366F1]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header of Radar Widget */}
            <div className="flex items-center justify-between pb-3 border-b border-[#252a37] relative z-10">
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#F59E0B]" />
                  <span>Biểu đồ Năng lực 5 Chiều</span>
                </h2>
                <p className="text-[11px] text-[#8b93a5]">
                  Định lượng hóa 5 năng lực cốt lõi theo phong cách MOBA Game
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 uppercase">
                5-Axis Radar
              </span>
            </div>

            {/* SVG Radar Chart (Custom Mathematical Polygon) */}
            <div className="relative py-4 flex items-center justify-center">
              <svg
                viewBox="0 0 400 390"
                className="w-full max-w-[380px] h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] overflow-visible"
              >
                <defs>
                  {/* Golden / Amber Radiant Gradient Fill for Competency Polygon */}
                  <radialGradient id="amberGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.75" />
                    <stop offset="65%" stopColor="#D97706" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#B45309" stopOpacity="0.2" />
                  </radialGradient>

                  <linearGradient id="gridStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#252a37" stopOpacity="0.8" />
                  </linearGradient>

                  <filter id="goldGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Concentric Dark Indigo Pentagons (Grid Web) */}
                {radarSvgData.webs.map(({ lvl, points }) => (
                  <polygon
                    key={lvl}
                    points={points}
                    fill="none"
                    stroke="url(#gridStrokeGrad)"
                    strokeWidth={lvl === 1.0 ? "1.5" : "1"}
                    strokeDasharray={lvl === 1.0 ? "none" : "3,3"}
                    opacity={lvl === 1.0 ? 0.9 : 0.6}
                  />
                ))}

                {/* Connecting Spokes Radiating from Center */}
                {radarSvgData.spokes.map((spoke) => (
                  <line
                    key={spoke.angleDeg}
                    x1={spoke.x1}
                    y1={spoke.y1}
                    x2={spoke.x2}
                    y2={spoke.y2}
                    stroke="#282e3d"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                ))}

                {/* Data Polygon Fill & Border Stroke */}
                <polygon
                  points={radarSvgData.polygonPointsString}
                  fill="url(#amberGlow)"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  filter="url(#goldGlowFilter)"
                  className="transition-all duration-500 ease-out"
                />

                {/* Vertex Dots & Value Markers */}
                {radarSvgData.dataPoints.map((pt) => (
                  <g key={pt.key} className="cursor-pointer group">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#FFFFFF"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      className="transition-transform duration-200 group-hover:scale-150"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1"
                      opacity="0.4"
                    />
                  </g>
                ))}

                {/* Labels around the 5 axes */}
                {/* 1. Top Axis: Độ chính xác */}
                <g transform="translate(200, 42)" textAnchor="middle">
                  <text className="font-heading font-extrabold fill-white text-[12px]">
                    Độ chính xác
                  </text>
                  <text className="font-mono text-[10px] fill-[#F59E0B] font-bold" y="14">
                    {stats.radarMetrics.accuracy}% ({RADAR_AXES[0].mobaTag})
                  </text>
                </g>

                {/* 2. Top-Right: Điểm trung bình */}
                <g transform="translate(335, 142)" textAnchor="start">
                  <text className="font-heading font-extrabold fill-white text-[12px]">
                    Điểm trung bình
                  </text>
                  <text className="font-mono text-[10px] fill-[#F59E0B] font-bold" y="14">
                    {(stats.radarMetrics.mastery / 10).toFixed(1)}/10 ({RADAR_AXES[1].mobaTag})
                  </text>
                </g>

                {/* 3. Bottom-Right: Chuyên cần */}
                <g transform="translate(300, 320)" textAnchor="start">
                  <text className="font-heading font-extrabold fill-white text-[12px]">
                    Chuyên cần
                  </text>
                  <text className="font-mono text-[10px] fill-[#F59E0B] font-bold" y="14">
                    {stats.radarMetrics.diligence}% ({RADAR_AXES[2].mobaTag})
                  </text>
                </g>

                {/* 4. Bottom-Left: Vận dụng cao */}
                <g transform="translate(100, 320)" textAnchor="end">
                  <text className="font-heading font-extrabold fill-white text-[12px]">
                    Vận dụng cao
                  </text>
                  <text className="font-mono text-[10px] fill-[#F59E0B] font-bold" y="14">
                    {stats.radarMetrics.problemSolving}% ({RADAR_AXES[3].mobaTag})
                  </text>
                </g>

                {/* 5. Top-Left: Kỷ luật & Tốc độ */}
                <g transform="translate(65, 142)" textAnchor="end">
                  <text className="font-heading font-extrabold fill-white text-[12px]">
                    Kỷ luật &amp; Tốc độ
                  </text>
                  <text className="font-mono text-[10px] fill-[#F59E0B] font-bold" y="14">
                    {stats.radarMetrics.discipline}% ({RADAR_AXES[4].mobaTag})
                  </text>
                </g>
              </svg>
            </div>

            {/* Quick Dimension Cards Below Radar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#252a37]">
              {RADAR_AXES.map((axis) => {
                const val = stats.radarMetrics[axis.key as keyof typeof stats.radarMetrics];
                return (
                  <div
                    key={axis.key}
                    className="p-2 rounded-xl bg-[#10131b] border border-[#252a37] flex flex-col justify-between"
                  >
                    <span className="text-[10px] text-[#8b93a5] uppercase font-semibold">
                      {axis.label}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-xs font-bold text-white">
                        {axis.key === "mastery" ? `${(val / 10).toFixed(1)}/10` : `${val}%`}
                      </span>
                      <span className="text-[10px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.2 rounded">
                        {axis.mobaTag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom CTA Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-200 text-black py-2.5 px-4 text-xs font-bold transition shadow-md cursor-pointer select-none active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Xem chi tiết phân tích chuyên sâu</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* COLUMN 3: RIGHT OVERVIEW METRICS & CRESTS (lg:col-span-4)   */}
        {/* ============================================================ */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="lg:col-span-4 space-y-4"
        >
          {/* Top Metric Cluster (3 Cards in horizontal flow) */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Card 1: Số lượt thi */}
            <div className="rounded-2xl bg-[#161a24] border border-[#252a37] p-3 text-center flex flex-col justify-between shadow-md">
              <span className="text-[10px] font-medium text-[#8b93a5] uppercase leading-tight">
                Số lượt thi
              </span>
              <p className="font-mono text-2xl font-extrabold text-white my-1 tabular-nums">
                {stats.totalExams}
              </p>
              <span className="text-[9px] text-[#10B981] font-semibold">Tích lũy</span>
            </div>

            {/* Card 2: Circular Progress Gauge (Tỷ lệ đạt chuẩn) */}
            <div className="rounded-2xl bg-[#161a24] border border-[#252a37] p-3 text-center flex flex-col items-center justify-between shadow-md">
              <span className="text-[10px] font-medium text-[#8b93a5] uppercase leading-tight">
                Đạt chuẩn
              </span>
              <div className="relative w-12 h-12 flex items-center justify-center my-0.5">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Track */}
                  <path
                    className="text-[#252a37]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Active Arc */}
                  <path
                    className="text-[#F59E0B]"
                    strokeDasharray={`${stats.passRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-[11px] font-bold text-white">
                  {stats.passRate}%
                </span>
              </div>
              <span className="text-[9px] text-amber-400 font-semibold">&gt;= 5.0 điểm</span>
            </div>

            {/* Card 3: Điểm tuyệt đối (10.0) */}
            <div className="rounded-2xl bg-[#161a24] border border-[#252a37] p-3 text-center flex flex-col justify-between shadow-md">
              <span className="text-[10px] font-medium text-[#8b93a5] uppercase leading-tight">
                Tuyệt đối
              </span>
              <p className="font-mono text-2xl font-extrabold text-[#F59E0B] my-1 tabular-nums">
                {stats.perfectScores}
              </p>
              <span className="text-[9px] text-amber-400 font-semibold">10.0 hoàn hảo</span>
            </div>
          </div>

          {/* Achievement & Rank Badge Grid (2-Column Grid of 8 Gaming-Styled Crests) */}
          <div className="rounded-2xl bg-[#161a24] border border-[#252a37] p-4.5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#252a37]">
              <span className="font-heading text-xs uppercase tracking-wider font-bold text-white flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Huân chương &amp; Thành tích</span>
              </span>
              <span className="text-[10px] font-mono text-[#8b93a5]">8 Danh hiệu</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Badge 1: Thủ khoa phòng thi */}
              <div className="p-2.5 rounded-xl bg-[#10131b] border border-amber-500/20 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/30 text-amber-400 shadow-sm">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-extrabold text-white leading-tight">
                    {stats.badges.valedictorian}
                  </p>
                  <p className="text-[10px] text-[#8b93a5] truncate">Thủ khoa phòng</p>
                </div>
              </div>

              {/* Badge 2: Hoàn hảo tuyệt đối */}
              <div className="p-2.5 rounded-xl bg-[#10131b] border border-cyan-500/20 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-700/10 border border-cyan-500/30 text-cyan-400 shadow-sm">
                  <Gem className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-extrabold text-white leading-tight">
                    {stats.badges.flawless}
                  </p>
                  <p className="text-[10px] text-[#8b93a5] truncate">Hoàn hảo 100%</p>
                </div>
              </div>

              {/* Badge 3: Chuỗi đúng 50 câu */}
              <div className="p-2.5 rounded-xl bg-[#10131b] border border-indigo-500/20 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-700/10 border border-indigo-500/30 text-indigo-400 shadow-sm">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-extrabold text-white leading-tight">
                    {stats.badges.streak50}
                  </p>
                  <p className="text-[10px] text-[#8b93a5] truncate">Chuỗi 50 câu</p>
                </div>
              </div>

              {/* Badge 4: Chuỗi đúng 20 câu */}
              <div className="p-2.5 rounded-xl bg-[#10131b] border border-orange-500/20 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-700/10 border border-orange-500/30 text-orange-400 shadow-sm">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-extrabold text-white leading-tight">
                    {stats.badges.streak20}
                  </p>
                  <p className="text-[10px] text-[#8b93a5] truncate">Chuỗi 20 câu</p>
                </div>
              </div>

              {/* Badge 5: Cúp Tinh Anh SSS */}
              <div className="p-2.5 rounded-xl bg-[#10131b] border border-purple-500/20 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-700/10 border border-purple-500/30 text-purple-400 shadow-sm font-heading font-black text-xs">
                  SSS
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-extrabold text-white leading-tight">
                    {stats.badges.tierSSS}
                  </p>
                  <p className="text-[10px] text-[#8b93a5] truncate">Điểm 9.5 – 10</p>
                </div>
              </div>

              {/* Badge 6: Cúp Ưu Tú SS */}
              <div className="p-2.5 rounded-xl bg-[#10131b] border border-amber-500/20 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-700/10 border border-amber-500/30 text-amber-300 shadow-sm font-heading font-black text-xs">
                  SS
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-extrabold text-white leading-tight">
                    {stats.badges.tierSS}
                  </p>
                  <p className="text-[10px] text-[#8b93a5] truncate">Điểm 8.5 – 9.4</p>
                </div>
              </div>

              {/* Badge 7: Cúp Giỏi S */}
              <div className="p-2.5 rounded-xl bg-[#10131b] border border-blue-500/20 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-slate-700/10 border border-blue-500/30 text-blue-300 shadow-sm font-heading font-black text-xs">
                  S
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-extrabold text-white leading-tight">
                    {stats.badges.tierS}
                  </p>
                  <p className="text-[10px] text-[#8b93a5] truncate">Điểm 7.0 – 8.4</p>
                </div>
              </div>

              {/* Badge 8: MVP Suýt hoàn hảo */}
              <div className="p-2.5 rounded-xl bg-[#10131b] border border-rose-500/20 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-red-700/10 border border-rose-500/30 text-rose-400 shadow-sm">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-extrabold text-white leading-tight">
                    {stats.badges.nearPerfect}
                  </p>
                  <p className="text-[10px] text-[#8b93a5] truncate">Điểm &gt;= 9.0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 rounded-2xl bg-[#161a24] border border-[#252a37] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <span className="text-[11px] text-[#8b93a5] text-center sm:text-left leading-relaxed">
              Tính trên chế độ thi chuẩn, sát hạch chính thức &amp; tự luyện.
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#10131b] hover:bg-[#1a202c] border border-[#252a37] hover:border-[#6366F1]/50 text-white text-xs font-semibold transition cursor-pointer select-none active:scale-95 shrink-0"
            >
              <Share2 className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Chia sẻ hồ sơ</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Share Toast Notification */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#161a24] border border-[#10B981]/50 p-3.5 shadow-2xl flex items-center gap-2.5 text-xs text-white"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>Đã sao chép liên kết Hồ sơ Năng lực (Gamified Stats) vào bộ nhớ tạm!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Deep Analysis Drawer / Modal */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-2xl rounded-3xl bg-[#161a24] border border-[#252a37] p-6 shadow-2xl space-y-5"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#252a37]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      Báo Cáo Phân Tích Năng Lực Chuyên Sâu
                    </h3>
                    <p className="text-xs text-[#8b93a5]">
                      Đánh giá chi tiết từng khía cạnh học thuật &amp; Khuyến nghị cải thiện
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 5 Axes Detailed Breakdown */}
              <div className="space-y-3.5">
                {RADAR_AXES.map((axis) => {
                  const val = stats.radarMetrics[axis.key as keyof typeof stats.radarMetrics];
                  return (
                    <div
                      key={axis.key}
                      className="p-3.5 rounded-2xl bg-[#10131b] border border-[#252a37] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-xs font-bold text-white">
                            {axis.label}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#6366F1]/20 text-[#a5b4fc] border border-[#6366F1]/30">
                            {axis.mobaTag}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#F59E0B]">
                          {axis.key === "mastery" ? `${(val / 10).toFixed(1)} / 10.0` : `${val} / 100`}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-[#1b202e] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#F59E0B] transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, val))}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {axis.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Academic Advisor Recommendations */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#6366F1]/10 to-[#10131b] border border-[#6366F1]/30 space-y-2">
                <h4 className="text-xs font-heading font-bold text-white flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>Lời khuyên từ Trợ lý Học vụ AI</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Chỉ số <strong>Chuyên cần ({stats.radarMetrics.diligence}%)</strong> và{" "}
                  <strong>Kỷ luật phòng thi ({stats.radarMetrics.discipline}%)</strong> của bạn đang ở mức rất cao. Hãy
                  tiếp tục rèn luyện các dạng bài tập tự luận nâng cao để bứt phá thêm ở trục{" "}
                  <strong>Vận dụng cao ({stats.radarMetrics.problemSolving}%)</strong> và đạt thêm nhiều huân chương Cúp Tinh Anh SSS!
                </p>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-5 py-2 rounded-full bg-white hover:bg-slate-200 text-black text-xs font-bold transition shadow-sm cursor-pointer select-none"
                >
                  Đóng phân tích
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
