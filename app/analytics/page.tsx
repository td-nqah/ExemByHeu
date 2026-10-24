"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSubmissions, getCurrentUser, getExams } from "@/lib/store";
import { Submission, Exam } from "@/types/exam";
import { formatDate } from "@/lib/utils";
import {
  TrendingUp,
  CheckCircle2,
  Zap,
  Target,
  Sparkles,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Layers,
} from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }

    async function loadData() {
      try {
        const [subData, examData] = await Promise.all([
          getSubmissions(user?.id),
          getExams(true),
        ]);
        setSubmissions(subData);
        setExams(examData);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Sort chronologically for timeline charts (oldest -> newest)
  const chronological = useMemo(() => {
    return [...submissions].sort(
      (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    );
  }, [submissions]);

  // Aggregate Metrics
  const totalSubmissions = submissions.length;

  const averageScore = useMemo(() => {
    if (totalSubmissions === 0) return 0;
    const sum = submissions.reduce(
      (acc, s) => acc + (Number(s.total_score) || 0),
      0
    );
    return Number((sum / totalSubmissions).toFixed(1));
  }, [submissions, totalSubmissions]);

  const peakScore = useMemo(() => {
    if (totalSubmissions === 0) return 0;
    return Math.max(...submissions.map((s) => Number(s.total_score) || 0));
  }, [submissions, totalSubmissions]);

  const mcqMetrics = useMemo(() => {
    if (totalSubmissions === 0) return { earned: 0, max: 0, rate: 0 };
    let earned = 0;
    let max = 0;
    submissions.forEach((s) => {
      earned += Number(s.mcq_score) || 0;
      max += Number(s.mcq_score) > 0 ? 10 : 0;
    });
    const rate = max > 0 ? Math.round((earned / max) * 100) : 0;
    return { earned, max, rate };
  }, [submissions, totalSubmissions]);

  // Exam Bank Completion Metrics
  const examCompletionMetrics = useMemo(() => {
    const totalBankExams = exams.length;
    // Set of distinct exam IDs completed by user
    const completedExamIds = new Set(
      submissions.map((s) => s.exam_id || s.exam?.id).filter(Boolean)
    );
    const completedCount = completedExamIds.size;
    const rate = totalBankExams > 0 ? Math.round((completedCount / totalBankExams) * 100) : 0;
    return {
      completedCount,
      totalBankExams,
      rate,
    };
  }, [exams, submissions]);

  const scoreDelta = useMemo(() => {
    if (chronological.length < 2) return 0;
    const first = Number(chronological[0].total_score) || 0;
    const latest = Number(chronological[chronological.length - 1].total_score) || 0;
    return Number((latest - first).toFixed(1));
  }, [chronological]);

  // SVG Chart Dimensions & Coordinates
  const chartPoints = useMemo(() => {
    if (chronological.length === 0) return [];
    const width = 760;
    const height = 240;
    const padX = 40;
    const padY = 30;

    const count = chronological.length;
    const stepX = count > 1 ? (width - padX * 2) / (count - 1) : 0;

    return chronological.map((sub, idx) => {
      const score = Math.max(0, Math.min(10, Number(sub.total_score || 0)));
      const x = count === 1 ? width / 2 : padX + idx * stepX;
      // y ranges from height - padY (score 0) down to padY (score 10)
      const y = height - padY - (score / 10) * (height - padY * 2);
      return { x, y, score, sub, index: idx };
    });
  }, [chronological]);

  // Build SVG Path
  const { pathD, areaD } = useMemo(() => {
    if (chartPoints.length === 0) return { pathD: "", areaD: "" };
    if (chartPoints.length === 1) {
      const pt = chartPoints[0];
      return {
        pathD: `M 40 ${pt.y} L 720 ${pt.y}`,
        areaD: `M 40 ${pt.y} L 720 ${pt.y} L 720 210 L 40 210 Z`,
      };
    }

    let d = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i];
      const p1 = chartPoints[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const last = chartPoints[chartPoints.length - 1];
    const first = chartPoints[0];
    const area = `${d} L ${last.x} 210 L ${first.x} 210 Z`;

    return { pathD: d, areaD: area };
  }, [chartPoints]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#F6F6F8] border border-black/[0.08] px-3 py-1 text-[11px] font-semibold text-[#111827] shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Trợ lý học thuật AI - Phân tích kết quả học tập</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] flex items-center gap-3">
            Phân tích Kết quả Học tập & Tiến độ Tích lũy
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B7280]">
            Theo dõi tiến độ điểm đánh giá, tổng hợp năng lực và định hướng kế hoạch học tập.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 glass-btn rounded-xl px-4 py-2 cursor-pointer"
        >
          <BookOpen className="h-4 w-4" />
          <span>Làm bài đánh giá mới</span>
        </Link>
      </div>

      {/* 4 Flat Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tiến Độ Hoàn Thành Đề */}
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Tiến độ Hoàn thành Bài đánh giá
            </p>
            <div className="h-9 w-9 rounded-xl bg-[#F6F6F8] flex items-center justify-center text-[#3B7DD8] shrink-0">
              <Layers className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-extrabold text-[#111827] tracking-tight">
              {examCompletionMetrics.completedCount}{" "}
              <span className="text-sm font-normal text-[#6B7280]">
                / {examCompletionMetrics.totalBankExams} đề
              </span>
            </p>
            {/* Visual Progress Bar */}
            <div className="w-full h-1.5 bg-[#F6F6F8] rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, examCompletionMetrics.rate))}%` }}
              />
            </div>
            <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center justify-between">
              <span>Tỷ lệ hoàn thành ngân hàng đề</span>
              <span className="font-semibold text-[#3B7DD8]">
                {examCompletionMetrics.rate}%
              </span>
            </p>
          </div>
        </div>

        {/* Card 2: Điểm Trung Bình */}
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Điểm Trung bình Đánh giá
            </p>
            <div className="h-9 w-9 rounded-xl bg-[#F6F6F8] flex items-center justify-center text-[#111827] shrink-0">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-extrabold text-[#111827] tracking-tight">
              {averageScore}{" "}
              <span className="text-sm font-normal text-[#6B7280]">/ 10</span>
            </p>
            <p className="text-[11px] text-[#6B7280] mt-2 flex items-center gap-1">
              {scoreDelta >= 0 ? (
                <span className="text-[#2E9E5B] font-semibold">
                  +{scoreDelta} đ
                </span>
              ) : (
                <span className="text-rose-400 font-semibold">
                  {scoreDelta} đ
                </span>
              )}{" "}
              <span>so với lượt đầu</span>
            </p>
          </div>
        </div>

        {/* Card 3: Tỉ Lệ Đúng Trắc Nghiệm */}
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Độ Chính Xác Trắc Nghiệm
            </p>
            <div className="h-9 w-9 rounded-xl bg-[#F6F6F8] flex items-center justify-center text-[#2E9E5B] shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-extrabold text-[#111827] tracking-tight">
              {mcqMetrics.rate}%
            </p>
            <p className="text-[11px] text-[#6B7280] mt-2 truncate">
              {mcqMetrics.earned} điểm trắc nghiệm đã ghi
            </p>
          </div>
        </div>

        {/* Card 4: Điểm Cao Nhất */}
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
              Điểm Đánh giá Cao nhất
            </p>
            <div className="h-9 w-9 rounded-xl bg-[#F6F6F8] flex items-center justify-center text-[#B8962E] shrink-0">
              <Zap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-extrabold text-[#111827] tracking-tight">
              {peakScore}{" "}
              <span className="text-sm font-normal text-[#6B7280]">/ 10</span>
            </p>
            <p className="text-[11px] text-[#6B7280] mt-2 truncate">
              Điểm số tối đa đã ghi nhận
            </p>
          </div>
        </div>


      </div>

      {/* Main Section: Flat Interactive Score Trend Line Chart */}
      <div className="bg-white border border-black/[0.06] rounded-[24px] p-6 sm:p-8 space-y-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-[#111827]" />
              <span>Biểu đồ Diễn biến Điểm đánh giá (Thang điểm 10)</span>
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Đồ thị phản ánh tổng điểm đánh giá thực tế qua các đợt kiểm tra theo trình tự thời gian.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-[#6B7280]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#111827]" />
              Tổng điểm
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[#6B7280]">
              Tổng số {chronological.length} mốc ghi nhận
            </span>
          </div>
        </div>

        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : chronological.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Target className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="text-base font-bold text-white">Chưa có dữ liệu bài đánh giá</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              Vui lòng hoàn thành ít nhất 1 bài đánh giá để hệ thống tổng hợp biểu đồ và phân tích kết quả học tập.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#4f57ea] hover:bg-[#434ac9] px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              <span>Bắt đầu làm bài</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* SVG Visual Canvas */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[640px]">
                <svg
                  viewBox="0 0 760 250"
                  className="w-full h-64 overflow-visible"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#111827" />
                      <stop offset="50%" stopColor="#E04A2A" />
                      <stop offset="100%" stopColor="#111827" />
                    </linearGradient>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#111827" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#111827" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[
                    { label: "10 đ", y: 30 },
                    { label: "7.5 đ", y: 75 },
                    { label: "5.0 đ", y: 120 },
                    { label: "2.5 đ", y: 165 },
                    { label: "0 đ", y: 210 },
                  ].map((grid, gIdx) => (
                    <g key={gIdx}>
                      <line
                        x1="40"
                        y1={grid.y}
                        x2="720"
                        y2={grid.y}
                        stroke="rgba(0, 0, 0, 0.06)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="32"
                        y={grid.y + 4}
                        fill="#7A7D88"
                        fontSize="10"
                        textAnchor="end"
                        fontWeight="500"
                      >
                        {grid.label}
                      </text>
                    </g>
                  ))}

                  {/* Area fill */}
                  {areaD && <path d={areaD} fill="url(#areaGrad)" />}

                  {/* Trend Line */}
                  {pathD && (
                    <path
                      d={pathD}
                      stroke="url(#lineGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Interactive Nodes */}
                  {chartPoints.map((pt, pIdx) => {
                    const isHovered = hoveredPointIndex === pIdx;
                    return (
                      <g
                        key={pIdx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(pIdx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      >
                        {/* Dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? "6" : "4.5"}
                          fill="#111827"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />

                        {/* X-Axis Label */}
                        <text
                          x={pt.x}
                          y={232}
                          fill={isHovered ? "#111827" : "#9CA3AF"}
                          fontSize="10"
                          textAnchor="middle"
                          fontWeight={isHovered ? "bold" : "normal"}
                        >
                          Lần {pIdx + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Hover Tooltip Card */}
            {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
              <div className="mt-3 rounded-2xl bg-white border border-black/[0.08] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#111827]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#111827] font-semibold">
                    Chi tiết lượt thi #{hoveredPointIndex + 1}
                  </span>
                  <p className="font-bold text-[#111827] text-sm">
                    {chartPoints[hoveredPointIndex].sub.exam?.title ||
                      "Bài thi thử trực tuyến"}
                  </p>
                  <p className="text-[#6B7280] text-[11px] mt-0.5">
                    Thời gian nộp:{" "}
                    {formatDate(chartPoints[hoveredPointIndex].sub.submitted_at)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[#6B7280] text-[11px] block">
                      Điểm trắc nghiệm:{" "}
                      <strong className="text-[#111827]">
                        {chartPoints[hoveredPointIndex].sub.mcq_score} đ
                      </strong>
                    </span>
                    <span className="text-[#6B7280] text-[11px] block">
                      Điểm tự luận:{" "}
                      <strong className="text-[#111827]">
                        {chartPoints[hoveredPointIndex].sub.essay_score !== null
                          ? `${chartPoints[hoveredPointIndex].sub.essay_score} đ`
                          : "Đang chấm"}
                      </strong>
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#F6F6F8] border border-white/[0.06] px-3 py-1.5 text-center">
                    <span className="text-[10px] text-[#111827] font-bold block">
                      TỔNG ĐIỂM
                    </span>
                    <span className="text-base font-extrabold text-[#111827]">
                      {chartPoints[hoveredPointIndex].score}
                    </span>
                  </div>

                  <Link
                    href={`/history/${chartPoints[hoveredPointIndex].sub.id}`}
                    className="inline-flex items-center gap-1 rounded-lg glass-btn cursor-pointer"
                  >
                    <span>Xem bài</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
