"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSubmissions, getCurrentUser } from "@/lib/store";
import { Submission } from "@/types/exam";
import { formatDate } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import {
  TrendingUp,
  CheckCircle2,
  Award,
  Zap,
  Target,
  Sparkles,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Calendar,
  AlertCircle,
  Lightbulb,
  Clock,
} from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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
        const data = await getSubmissions(user?.id);
        setSubmissions(data);
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

  const validScores = submissions
    .filter((s) => s.status === "graded" || typeof s.total_score === "number")
    .map((s) => Number(s.total_score || 0));

  const averageScore =
    validScores.length > 0
      ? Math.round(
          (validScores.reduce((sum, sc) => sum + sc, 0) / validScores.length) * 10
        ) / 10
      : 0;

  const peakScore = validScores.length > 0 ? Math.max(...validScores) : 0;

  // Calculate MCQ Accuracy across submissions
  const mcqMetrics = useMemo(() => {
    let earned = 0;
    let possible = 0;
    submissions.forEach((sub) => {
      earned += Number(sub.mcq_score || 0);
      const qList = sub.exam?.questions || [];
      const mcqMax = qList
        .filter((q) => q.type === "multiple_choice")
        .reduce((sum, q) => sum + Number(q.max_score || 0), 0);
      possible += mcqMax > 0 ? mcqMax : Number(sub.mcq_score || 5);
    });
    const rate = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    return { earned, possible, rate };
  }, [submissions]);

  // Calculate trend delta (last score vs first score)
  const scoreDelta = useMemo(() => {
    if (chronological.length < 2) return 0;
    const first = Number(chronological[0].total_score || 0);
    const last = Number(chronological[chronological.length - 1].total_score || 0);
    return Math.round((last - first) * 10) / 10;
  }, [chronological]);

  // SVG Chart Geometry
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
        pathD: `M ${pt.x - 40} ${pt.y} L ${pt.x + 40} ${pt.y}`,
        areaD: `M ${pt.x - 40} ${pt.y} L ${pt.x + 40} ${pt.y} L ${pt.x + 40} 210 L ${pt.x - 40} 210 Z`,
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
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-[11px] font-medium text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Performance Diagnostics Engine</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Phân tích Phong độ & Tiến độ Ôn luyện
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Theo dõi sự tiến bộ điểm số qua từng lần làm bài, chẩn đoán điểm mạnh và chiến lược tối ưu điểm số.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all self-start md:self-auto"
        >
          <BookOpen className="h-4 w-4" />
          <span>Vào làm bài thi mới</span>
        </Link>
      </motion.div>

      {/* 4 Stats Cards (SaaS Premium Glassmorphism) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Điểm Trung Bình */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-xl hover:border-indigo-500/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] transition-all duration-300 rounded-2xl p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Điểm Trung Bình
            </p>
            <p className="text-3xl font-extrabold text-white mt-1 tracking-tight">
              {averageScore}{" "}
              <span className="text-xs font-normal text-slate-400">/ 10</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              {scoreDelta >= 0 ? (
                <span className="text-emerald-400 font-semibold">
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
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <TrendingUp className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Card 2: Tỉ Lệ Đúng Trắc Nghiệm */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-xl hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] transition-all duration-300 rounded-2xl p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Độ Chính Xác Trắc Nghiệm
            </p>
            <p className="text-3xl font-extrabold text-white mt-1 tracking-tight">
              {mcqMetrics.rate}%
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {mcqMetrics.earned} điểm trắc nghiệm đã ghi
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Card 3: Số Lượt Bài Thi Đã Nộp */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-xl hover:border-indigo-500/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] transition-all duration-300 rounded-2xl p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Số Bài Đã Nộp
            </p>
            <p className="text-3xl font-extrabold text-white mt-1 tracking-tight">
              {totalSubmissions}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Được lưu trữ chi tiết lịch sử
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Award className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Card 4: Điểm Cao Nhất */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-xl hover:border-amber-500/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] transition-all duration-300 rounded-2xl p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Điểm Kỷ Lục Đạt Được
            </p>
            <p className="text-3xl font-extrabold text-amber-300 mt-1 tracking-tight">
              {peakScore}{" "}
              <span className="text-xs font-normal text-slate-400">/ 10</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Phong độ cao nhất từng đạt
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Zap className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Section: Interactive Score Trend Line Chart */}
      <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              <span>Biểu đồ Tiến trình Điểm số (Performance Timeline)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Đường đồ thị phản ánh tổng điểm thực tế qua các lượt thi theo trình tự thời gian.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              Tổng điểm
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
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
            <h3 className="text-base font-bold text-white">Chưa có dữ liệu làm bài</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Hãy hoàn thành ít nhất 1 bài thi thử để hệ thống vẽ biểu đồ phong độ và đưa ra nhận xét năng lực.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30"
            >
              <span>Bắt đầu thi ngay</span>
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
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="50%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines for 10, 7.5, 5, 2.5, 0 */}
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
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="32"
                        y={grid.y + 4}
                        fill="#94A3B8"
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
                      strokeWidth="3.5"
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
                        {/* Glow ring on hover */}
                        {isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="12"
                            fill="#818CF8"
                            fillOpacity="0.3"
                          />
                        )}

                        {/* Outer Dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? "7" : "5"}
                          fill="#4F46E5"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          className="transition-all duration-200"
                        />

                        {/* X-Axis Label */}
                        <text
                          x={pt.x}
                          y={232}
                          fill={isHovered ? "#FFFFFF" : "#94A3B8"}
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
              <div className="mt-3 rounded-xl bg-slate-900/90 border border-white/10 p-3.5 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">
                    Chi tiết lượt thi #{hoveredPointIndex + 1}
                  </span>
                  <p className="font-bold text-white text-sm">
                    {chartPoints[hoveredPointIndex].sub.exam?.title ||
                      "Bài thi thử trực tuyến"}
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Thời gian nộp:{" "}
                    {formatDate(chartPoints[hoveredPointIndex].sub.submitted_at)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">
                      Điểm trắc nghiệm:{" "}
                      <strong className="text-slate-200">
                        {chartPoints[hoveredPointIndex].sub.mcq_score} đ
                      </strong>
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      Điểm tự luận:{" "}
                      <strong className="text-slate-200">
                        {chartPoints[hoveredPointIndex].sub.essay_score !== null
                          ? `${chartPoints[hoveredPointIndex].sub.essay_score} đ`
                          : "Đang chấm"}
                      </strong>
                    </span>
                  </div>

                  <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-center">
                    <span className="text-[10px] text-indigo-300 block">
                      TỔNG ĐIỂM
                    </span>
                    <span className="text-base font-extrabold text-white">
                      {chartPoints[hoveredPointIndex].score}
                    </span>
                  </div>

                  <Link
                    href={`/history/${chartPoints[hoveredPointIndex].sub.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-semibold transition"
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

      {/* 2 Diagnostic Insight Cards (Điểm Mạnh / Điểm Cần Cải Thiện & Khuyến Nghị) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Điểm Mạnh Nổi Bật */}
        <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Điểm Mạnh & Lợi Thế Cạnh Tranh
              </h3>
              <p className="text-[11px] text-slate-400">
                Được tổng hợp từ độ chính xác các bài thi đã làm
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-900/60 border border-white/5 p-3">
              <div className="h-2 w-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <p>
                <strong className="text-white">Tốc độ & phản xạ Trắc nghiệm:</strong>{" "}
                Đạt tỉ lệ đúng <span className="text-emerald-400 font-semibold">{mcqMetrics.rate}%</span>. Bạn có nền tảng kiến thức trắc nghiệm vững chắc và tốc độ chọn đáp án ổn định.
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-slate-900/60 border border-white/5 p-3">
              <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <p>
                <strong className="text-white">Xu hướng tiến bộ tích cực:</strong>{" "}
                {scoreDelta >= 0 ? (
                  <>
                    Điểm số của bạn có biên độ cải thiện rõ rệt (+{scoreDelta} điểm). Khả năng thích ứng với các dạng đề thi phân hóa tốt.
                  </>
                ) : (
                  <>
                    Điểm số giữa các đề thi khá đồng đều, cho thấy phong độ ổn định không bị trồi sụt quá mức.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Card: Chiến Lược Tối Ưu & Khuyến Nghị */}
        <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Chiến Lược Tối Ưu Hóa Điểm Số
              </h3>
              <p className="text-[11px] text-slate-400">
                Gợi ý phương pháp ôn tập cá nhân hóa
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-900/60 border border-white/5 p-3">
              <div className="h-2 w-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <p>
                <strong className="text-white">Đầu tư sâu vào phần Tự luận:</strong>{" "}
                Các câu hỏi tự luận chiếm tỉ trọng điểm số lớn. Khi làm bài, hãy phân bổ cấu trúc câu trả lời rõ ràng (định nghĩa, phân tích, ví dụ thực tế) để nhận điểm tối đa từ giáo viên/AI.
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-slate-900/60 border border-white/5 p-3">
              <div className="h-2 w-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
              <p>
                <strong className="text-white">Tận dụng tính năng Đánh dấu xem lại:</strong>{" "}
                Trong phòng thi, hãy gắn cờ các câu hỏi phân vân để quay lại kiểm tra trước khi bấm nộp, tránh mất điểm ở các câu hỏi bẫy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
