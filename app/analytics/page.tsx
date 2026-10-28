"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSubmissions, getCurrentUser, getCategories } from "@/lib/store";
import { Submission, Category, Profile } from "@/types/exam";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  Trophy,
  Crown,
  Compass,
  History,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
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
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [useDemoFallback, setUseDemoFallback] = useState<boolean>(false);

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

  // Filter submissions by Subject
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Subject filter
      if (selectedSubject !== "all") {
        const subCat = (sub.exam?.category_id || sub.exam?.title || "").toLowerCase();
        if (!subCat.includes(selectedSubject.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, selectedSubject]);

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

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* User Info Tag */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161a24] border border-[#252a37] text-xs">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              <span className="font-semibold text-white">{user?.username || "Thí sinh"}</span>
              <span className="text-[#8b93a5]">({user?.role === "admin" ? "Quản trị viên" : "Sinh viên"})</span>
              <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Cao Thủ
              </span>
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
        </div>
      </motion.div>

      {/* 2. Main Dashboard Layout (2-Column Architecture) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* ============================================================ */}
        {/* COLUMN 1: 5-AXIS COMPETENCY RADAR WIDGET (lg:col-span-6)    */}
        {/* ============================================================ */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="lg:col-span-6 space-y-4"
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
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* COLUMN 2: RIGHT OVERVIEW METRICS & CRESTS (lg:col-span-6)   */}
        {/* ============================================================ */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="lg:col-span-6 space-y-4"
        >
          {/* Achievement & Rank Badge Grid (4 Cards: SSS, SS, S, Số lần thi) */}
          <div className="rounded-2xl bg-[#161a24] border border-[#252a37] p-4.5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#252a37]">
              <span className="font-heading text-xs uppercase tracking-wider font-bold text-white flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Huân chương &amp; Thành tích</span>
              </span>
              <span className="text-[10px] font-mono text-[#8b93a5]">4 Danh hiệu</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Badge 1: Cúp Tinh Anh SSS */}
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

              {/* Badge 2: Cúp Ưu Tú SS */}
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

              {/* Badge 3: Cúp Giỏi S */}
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

              {/* Badge 4: Số lần thi */}
              <div className="p-2.5 rounded-xl bg-[#10131b] border border-indigo-500/20 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-700/10 border border-indigo-500/30 text-indigo-400 shadow-sm">
                  <History className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-extrabold text-white leading-tight">
                    {stats.totalExams}
                  </p>
                  <p className="text-[10px] text-[#8b93a5] truncate">Số lần thi</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
