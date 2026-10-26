"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
} from "@/lib/store";
import { Profile, AccountSecurity } from "@/types/exam";
import {
  HardDrive,
  Database,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FolderArchive,
  Layers,
  Copy,
  Check,
  Monitor,
  Globe,
  Power,
  Sliders,
  Radio,
  Activity,
  Trash2,
} from "lucide-react";

export default function AdminPermissionsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // =========================================================================
  // PHẦN 1: THEO DÕI BỘ NHỚ TÀI NGUYÊN (ĐO LƯỜNG TỪNG MB)
  // =========================================================================
  const maxStorageMB = 500.0;
  const [isScanning, setIsScanning] = useState(false);

  const [stats, setStats] = useState({ exams: 0, questions: 0, submissions: 0 });
  const [dbTablesMB, setDbTablesMB] = useState(0);
  const [filesStorageMB, setFilesStorageMB] = useState(0);
  const [cacheLogsMB, setCacheLogsMB] = useState(0);
  const [rpcConfigured, setRpcConfigured] = useState<boolean | null>(null);
  const [rpcSqlScript, setRpcSqlScript] = useState<string>(
    "CREATE OR REPLACE FUNCTION get_db_size()\nRETURNS bigint AS $$\n SELECT pg_database_size(current_database());\n$$ LANGUAGE sql SECURITY DEFINER;"
  );
  const [copiedSql, setCopiedSql] = useState(false);

  const usedStorageMB = useMemo(() => {
    return Number((dbTablesMB + filesStorageMB + cacheLogsMB).toFixed(1));
  }, [dbTablesMB, filesStorageMB, cacheLogsMB]);

  const storagePercentage = useMemo(() => {
    return Number(((usedStorageMB / maxStorageMB) * 100).toFixed(1));
  }, [usedStorageMB, maxStorageMB]);

  const isHighStorage = storagePercentage >= 80.0;

  const getClientCacheEstimateMB = async (): Promise<number> => {
    if (typeof window !== "undefined" && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageBytes = estimate.usage || 0;
        return Number((usageBytes / (1024 * 1024)).toFixed(2));
      } catch {}
    }
    if (typeof window !== "undefined" && window.localStorage) {
      let totalLen = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalLen += (localStorage.getItem(key) || "").length * 2;
        }
      }
      return Number(Math.max(0.1, totalLen / (1024 * 1024)).toFixed(2));
    }
    return 0.5;
  };

  const handleRecalculateStorage = async () => {
    setIsScanning(true);
    try {
      const [statsRes, clientCacheMB] = await Promise.all([
        fetch("/api/admin/system-stats").then((r) => r.json()).catch(() => null),
        getClientCacheEstimateMB(),
      ]);

      if (statsRes && statsRes.success) {
        setDbTablesMB(statsRes.database.mb);
        setFilesStorageMB(statsRes.storage.mb);
        setCacheLogsMB(clientCacheMB);
        setStats({
          exams: statsRes.stats.exams,
          questions: statsRes.stats.questions,
          submissions: statsRes.stats.submissions,
        });
        setRpcConfigured(statsRes.rpcConfigured);
        if (statsRes.rpcSqlScript) {
          setRpcSqlScript(statsRes.rpcSqlScript);
        }
      } else {
        setCacheLogsMB(clientCacheMB);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // =========================================================================
  // PHẦN 2: QUẢN LÝ KÍCH HOẠT & THIẾT BỊ USER
  // =========================================================================
  const [accountsSecurity, setAccountsSecurity] = useState<AccountSecurity[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountActionNotice, setAccountActionNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const fetchAccountsSecurity = async (silent = false) => {
    if (!silent) setAccountsLoading(true);
    try {
      const res = await fetch("/api/admin/accounts");
      const data = await res.json();
      if (res.ok && data.accounts) {
        setAccountsSecurity(data.accounts);
      }
    } catch (err) {
      console.error("Failed to fetch accounts security:", err);
    } finally {
      if (!silent) setAccountsLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    handleRecalculateStorage();
    fetchAccountsSecurity();

    // Heartbeat ping & real-time presence polling
    const pingHeartbeat = () => {
      fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "heartbeat",
          username: user.username,
          activity: "Bảng Phân quyền & Giám sát Trực tuyến",
        }),
      }).catch(() => {});
    };

    pingHeartbeat();

    // Poll presence every 8 seconds silently
    const interval = setInterval(() => {
      fetchAccountsSecurity(true);
      pingHeartbeat();
    }, 8000);

    return () => clearInterval(interval);
  }, [router]);

  const isAccountOnline = (acc: AccountSecurity) => {
    if (
      currentUser?.username &&
      acc.username &&
      currentUser.username.toLowerCase() === acc.username.toLowerCase()
    ) {
      return true;
    }
    if (!acc.last_active_at) return false;
    const diffMs = Date.now() - new Date(acc.last_active_at).getTime();
    return diffMs >= 0 && diffMs < 3 * 60 * 1000;
  };

  const formatTimeAgo = (dateStr?: string, online?: boolean) => {
    if (online) return "Vừa xong (Trực tuyến)";
    if (!dateStr) return "Chưa có phiên";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (diffMs < 60 * 1000) return "Vừa xong";
    const diffMin = Math.floor(diffMs / (60 * 1000));
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  const allPresenceAccounts = useMemo(() => {
    const list = (
      accountsSecurity.length > 0
        ? [...accountsSecurity]
        : [
            {
              username: "adm",
              role: "admin" as const,
              is_active: true,
              ips: ["127.0.0.1"],
              devices: ["Windows (Chrome)"],
              last_active_at: new Date().toISOString(),
              current_activity: "Bảng Phân quyền & Giám sát Trực tuyến",
            },
            {
              username: "tth",
              role: "user" as const,
              is_active: true,
              ips: [],
              devices: [],
              current_activity: "Chưa trực tuyến",
            },
            {
              username: "tmh",
              role: "user" as const,
              is_active: true,
              ips: [],
              devices: [],
              current_activity: "Chưa trực tuyến",
            },
          ]
    ).filter((a) => !["user", "user1"].includes(a.username.toLowerCase()));

    // Ensure current user is in the list
    if (
      currentUser?.username &&
      !list.some((a) => a.username.toLowerCase() === currentUser.username.toLowerCase())
    ) {
      list.unshift({
        username: currentUser.username,
        role: currentUser.role,
        is_active: true,
        ips: ["127.0.0.1"],
        devices: ["Thiết bị hiện tại"],
        last_active_at: new Date().toISOString(),
        current_activity: "Bảng Phân quyền & Giám sát Trực tuyến",
      });
    }

    // Sort: Online accounts first (current user top), then offline sorted by last activity
    return list.sort((a, b) => {
      const aIsCurrent =
        currentUser?.username?.toLowerCase() === a.username.toLowerCase();
      const bIsCurrent =
        currentUser?.username?.toLowerCase() === b.username.toLowerCase();
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;

      const aOnline = isAccountOnline(a);
      const bOnline = isAccountOnline(b);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;

      const aTime = a.last_active_at ? new Date(a.last_active_at).getTime() : 0;
      const bTime = b.last_active_at ? new Date(b.last_active_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [accountsSecurity, currentUser]);

  const onlineCount = useMemo(() => {
    return allPresenceAccounts.filter(isAccountOnline).length;
  }, [allPresenceAccounts, currentUser]);

  const handleToggleActive = async (username: string, currentActive: boolean) => {
    setAccountsLoading(true);
    setAccountActionNotice(null);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_active",
          username,
          is_active: !currentActive,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccountActionNotice({
          type: "success",
          message: data.message,
        });
        await fetchAccountsSecurity();
      } else {
        setAccountActionNotice({
          type: "error",
          message: data.error || "Không thể cập nhật trạng thái tài khoản.",
        });
      }
    } catch {
      setAccountActionNotice({
        type: "error",
        message: "Lỗi kết nối khi cập nhật tài khoản.",
      });
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleResetSecurity = async (username: string) => {
    setAccountsLoading(true);
    setAccountActionNotice(null);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_security",
          username,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccountActionNotice({
          type: "success",
          message: data.message,
        });
        await fetchAccountsSecurity();
      } else {
        setAccountActionNotice({
          type: "error",
          message: data.error || "Không thể đặt lại thiết bị cho tài khoản.",
        });
      }
    } catch {
      setAccountActionNotice({
        type: "error",
        message: "Lỗi kết nối khi đặt lại thiết bị.",
      });
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleDeleteAccount = async (username: string) => {
    setIsDeletingUser(true);
    setAccountActionNotice(null);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_account",
          username,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccountActionNotice({
          type: "success",
          message: data.message || `Đã xóa tài khoản '${username}' thành công.`,
        });
        setDeleteTargetUser(null);
        await fetchAccountsSecurity();
      } else {
        setAccountActionNotice({
          type: "error",
          message: data.error || "Không thể xóa tài khoản này.",
        });
      }
    } catch {
      setAccountActionNotice({
        type: "error",
        message: "Lỗi kết nối khi xóa tài khoản.",
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1f2937]">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Sliders className="h-7 w-7 text-[#6366f1]" />
            <span>Quản trị Tài khoản & Phân quyền Học vụ</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#9ca3af] max-w-xl">
            Giám sát tài nguyên lưu trữ học vụ, quản trị quyền truy cập và bảo mật thiết bị sinh viên.
          </p>
        </div>
      </div>

      {/* =========================================================================
          1. THEO DÕI LƯU LƯỢNG BỘ NHỚ HỆ THỐNG
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="h-4.5 w-4.5 text-indigo-400" />
            <span>1. Giám sát Dung lượng Lưu trữ Học vụ (Đo lường từng MB)</span>
          </h2>
          <span className="text-xs text-[#9ca3af] font-sans tracking-normal">
            Giới hạn: <strong className="font-mono text-slate-300">{maxStorageMB} MB</strong>
          </span>
        </div>

        <div className="rounded-2xl obsidian-card p-6 space-y-5">
          {/* Status Alert Banner */}
          {isHighStorage ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-rose-300">
                  CẢNH BÁO: Dung lượng bộ nhớ đã vượt quá 80% ({storagePercentage}%)!
                </h3>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  Bộ nhớ đã dùng {usedStorageMB} MB trên tổng {maxStorageMB} MB. Vui lòng dọn dẹp các bài nộp cũ hoặc tệp đính kèm để tránh gián đoạn các kỳ thi tiếp theo.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="font-semibold text-xs text-white">Dung lượng trong ngưỡng an toàn</h3>
                  <p className="text-xs text-[#9ca3af]">
                    Đang sử dụng <strong className="text-white font-mono">{isScanning ? "..." : usedStorageMB} MB</strong> / {maxStorageMB} MB ({isScanning ? "..." : storagePercentage}% khả dụng).
                  </p>
                </div>
              </div>

              {/* Recalculate Button */}
              <button
                type="button"
                onClick={handleRecalculateStorage}
                disabled={isScanning}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-xs text-white font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm shadow-black/40 border border-indigo-400/20 select-none"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
                <span>{isScanning ? "Đang quét..." : "Quét lại bộ nhớ"}</span>
              </button>
            </div>
          )}

          {/* Progress Bar Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 flex items-center gap-2">
                <span>Tổng dung lượng tài nguyên đã dùng:</span>
                <strong className="text-white font-mono text-sm">{usedStorageMB} MB</strong>
              </span>
              <span className="font-mono text-slate-400 font-bold">
                {storagePercentage}% / 100%
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isHighStorage
                    ? "bg-rose-500"
                    : "bg-indigo-600"
                }`}
                style={{ width: `${Math.min(100, Math.max(2, storagePercentage))}%` }}
              />
            </div>
          </div>

          {/* Granular Breakdown (3 Categories) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1. Database Tables */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Database className="h-4 w-4 text-indigo-400" />
                  <span>Dữ liệu Bảng (DB)</span>
                </div>
                <span className="font-mono text-sm font-bold text-white">
                  {dbTablesMB} MB
                </span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-[#111827] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, (dbTablesMB / maxStorageMB) * 100 * 2)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span>Supabase PostgreSQL</span>
                  <span>{stats.exams} đề • {stats.questions} câu • {stats.submissions} bài</span>
                </div>
              </div>
            </div>

            {/* 2. File Storage Buckets */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <FolderArchive className="h-4 w-4 text-indigo-400" />
                  <span>Tệp lưu trữ (Storage)</span>
                </div>
                <span className="font-mono text-sm font-bold text-white">
                  {filesStorageMB} MB
                </span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-[#111827] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${Math.min(100, (filesStorageMB / maxStorageMB) * 100 * 2)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span>Tệp Word / PDF / Ảnh</span>
                  <span>Buckets &amp; Uploads</span>
                </div>
              </div>
            </div>

            {/* 3. Browser Cache & Logs */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  <span>Bộ nhớ đệm (Cache)</span>
                </div>
                <span className="font-mono text-sm font-bold text-white">
                  {cacheLogsMB} MB
                </span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-[#111827] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, (cacheLogsMB / maxStorageMB) * 100 * 2)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span>Local Storage &amp; IndexedDB</span>
                  <span>Thiết bị hiện tại</span>
                </div>
              </div>
            </div>
          </div>

          {/* RPC Config guidance */}
          {rpcConfigured === false && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/25 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  Kích hoạt đo lường dung lượng PostgreSQL thực tế:
                </span>
                <span className="text-xs font-sans text-slate-400 tracking-normal">Tùy chọn nâng cao</span>
              </div>
              <p className="text-[#9ca3af] text-[11px]">
                Để đọc chính xác kích thước cơ sở dữ liệu Supabase, bạn có thể dán đoạn mã sau vào SQL Editor trong bảng điều khiển Supabase:
              </p>
              <pre className="p-2.5 rounded-lg bg-[#111827] border border-[#1f2937] text-[10px] font-mono text-[#38bdf8] overflow-x-auto">
                {rpcSqlScript}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(rpcSqlScript);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1f2937] hover:bg-[#374151] text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? "Đã sao chép" : "Sao chép lệnh SQL"}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          2. QUẢN LÝ TÀI KHOẢN, BẢO MẬT THIẾT BỊ & GIÁM SÁT TRỰC TUYẾN (2 CARDS)
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />
            <span>2. Quản trị Tài khoản &amp; Giám sát Truy cập Trực tuyến</span>
          </h2>
          <span className="text-xs text-[#9ca3af]">Kiểm soát bảo mật tài khoản học vụ và theo dõi sinh viên trực tuyến thời gian thực</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* CARD 1 (BÊN TRÁI): Kiểm soát Kích hoạt & Thiết bị Đăng nhập */}
          <div className="relative rounded-2xl obsidian-card p-6 space-y-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 text-white shadow-sm shadow-black/40">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Kiểm soát Kích hoạt &amp; Thiết bị Truy cập</span>
                  </h3>
                  <p className="text-xs text-[#9ca3af]">
                    Tự động chuyển trạng thái Tạm khóa nếu tài khoản đăng nhập quá 3 thiết bị
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchAccountsSecurity(false)}
                disabled={accountsLoading}
                className="p-2 rounded-xl bg-[#0b0f19] hover:bg-[#1f2937] border border-[#1f2937] text-slate-300 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
                title="Làm mới trạng thái bảo mật"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${accountsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {accountActionNotice && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 shadow-sm ${
                  accountActionNotice.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                    : "bg-rose-500/10 border border-rose-500/25 text-rose-300"
                }`}
              >
                {accountActionNotice.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <span>{accountActionNotice.message}</span>
              </div>
            )}

            {/* Accounts list table / rows (Excludes Admin) */}
            <div className="space-y-2.5 flex-1 min-h-0">
              {(() => {
                const filtered = (
                  accountsSecurity.length > 0
                    ? accountsSecurity
                    : [
                        { username: "tth", role: "user", is_active: true, ips: [], devices: [] },
                        { username: "tmh", role: "user", is_active: true, ips: [], devices: [] },
                      ]
                ).filter(
                  (acc) =>
                    acc.role !== "admin" &&
                    acc.username !== "adm" &&
                    !["user", "user1"].includes(acc.username.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <div className="p-4 rounded-xl border border-dashed border-[#1f2937] text-center text-xs text-[#9ca3af]">
                      Chưa có tài khoản sinh viên nào trong hệ thống.
                    </div>
                  );
                }

                return filtered.map((acc) => {
                  const ipCount = acc.ips?.length || 0;
                  const devCount = acc.devices?.length || 0;
                  const isActive = acc.is_active !== false;

                  return (
                    <div
                      key={acc.username}
                      className="rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-150"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-white">
                            {acc.username}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1f2937] text-slate-300 border border-[#1f2937] font-medium tracking-normal">
                            {acc.role === "admin" ? "Admin" : "Sinh viên"}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium border tracking-normal ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {isActive ? "Đang kích hoạt" : "Tạm khóa (Off)"}
                          </span>
                        </div>

                        {/* Device counter */}
                        <div className="flex items-center gap-2 text-xs text-[#9ca3af] font-sans tracking-normal">
                          <span
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border tracking-normal ${
                              devCount > 3
                                ? "bg-rose-500/10 border-rose-500/25 text-rose-300 font-semibold"
                                : "bg-[#0b0f19] border-[#1f2937] text-slate-300"
                            }`}
                            title={
                              acc.devices && acc.devices.length > 0
                                ? `Danh sách thiết bị: ${acc.devices.join(", ")}`
                                : "Chưa có thiết bị nào ghi nhận"
                            }
                          >
                            <Monitor className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            <span>Thiết bị: <strong className="font-mono text-white tabular-nums">{devCount}</strong>/3</span>
                          </span>
                        </div>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Toggle Active Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(acc.username, isActive)}
                          disabled={accountsLoading || isDeletingUser}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 active:scale-95 tracking-normal ${
                            isActive
                              ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30"
                              : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                          }`}
                          title={isActive ? "Chuyển trạng thái sang Off" : "Chuyển trạng thái sang On"}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{isActive ? "Off" : "On"}</span>
                        </button>

                        {/* Reset Device Counter Button */}
                        <button
                          type="button"
                          onClick={() => handleResetSecurity(acc.username)}
                          disabled={accountsLoading || isDeletingUser}
                          className="px-2.5 py-1.5 rounded-lg bg-[#4f46e5]/15 hover:bg-[#4f46e5]/25 border border-[#4f46e5]/30 text-indigo-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 active:scale-95 tracking-normal"
                          title="Reset danh sách thiết bị về 0/3 và mở khóa tài khoản"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Reset (0/3)</span>
                        </button>

                        {/* Delete Account Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteTargetUser(acc.username)}
                          disabled={accountsLoading || isDeletingUser}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-[#1f2937] hover:border-rose-500/30 transition cursor-pointer disabled:opacity-50 active:scale-95"
                          title={`Xóa vĩnh viễn tài khoản ${acc.username}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="mt-4 pt-3 border-t border-[#1f2937] flex items-center justify-between text-xs text-[#9ca3af]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Chính sách: Khóa bảo vệ khi vượt ngưỡng 3 thiết bị đăng nhập (áp dụng cho user, không giới hạn IP)</span>
              </span>
              <span className="font-mono text-xs text-[#6b7280]">Auto-Enforced</span>
            </div>
          </div>

          {/* CARD 2 (BÊN PHẢI): Người dùng đang Online / Đang hoạt động thời gian thực */}
          <div className="relative rounded-2xl obsidian-card p-6 space-y-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 text-white shadow-sm shadow-black/40">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Người dùng đang Online</span>
                    <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium tracking-normal">
                      <strong className="font-mono tabular-nums">{onlineCount}/{allPresenceAccounts.length}</strong> Đang hoạt động
                    </span>
                  </h3>
                  <p className="text-xs text-[#9ca3af]">
                    Theo dõi người dùng đang truy cập &amp; sử dụng hệ thống thời gian thực
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchAccountsSecurity(false)}
                disabled={accountsLoading}
                className="p-2 rounded-xl bg-[#0b0f19] hover:bg-[#1f2937] border border-[#1f2937] text-slate-300 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
                title="Làm mới trạng thái Online"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${accountsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                <span className="text-[#9ca3af] flex items-center gap-1.5 text-xs font-sans tracking-normal">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Đang trực tuyến</span>
                </span>
                <span className="font-sans font-medium text-emerald-300 text-xs tracking-normal">
                  <strong className="font-mono font-bold tabular-nums">{onlineCount}</strong> người
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                <span className="text-[#9ca3af] flex items-center gap-1.5 text-xs font-sans tracking-normal">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  <span>Ngoại tuyến (Offline)</span>
                </span>
                <span className="font-sans font-medium text-slate-400 text-xs tracking-normal">
                  <strong className="font-mono font-bold tabular-nums">{allPresenceAccounts.length - onlineCount}</strong> người
                </span>
              </div>
            </div>

            {/* List of Accounts with Live Online / Recent Session Status (Scrollable) */}
            <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto max-h-[225px] sm:max-h-[235px] pr-0.5 custom-scrollbar no-scrollbar">
              {allPresenceAccounts.map((acc) => {
                const isOnline = isAccountOnline(acc);
                const isCurrent = currentUser?.username?.toLowerCase() === acc.username.toLowerCase();

                return (
                  <div
                    key={acc.username}
                    className="rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 p-3.5 space-y-2 transition-all duration-150"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar / Role Initial */}
                        <div
                          className={`relative flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold font-mono ${
                            acc.role === "admin"
                              ? "bg-[#4f46e5]/15 border-[#4f46e5]/30 text-indigo-300"
                              : "bg-slate-800 border-white/10 text-slate-200"
                          }`}
                        >
                          {acc.username.slice(0, 2).toUpperCase()}
                          {isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0b0f19]" />
                          )}
                        </div>

                        {/* Username & Role Badges */}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-white">
                              {acc.username}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium font-sans tracking-normal ${
                                acc.role === "admin"
                                  ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                                  : "bg-slate-800 border-slate-700 text-slate-300"
                              }`}
                            >
                              {acc.role === "admin" ? "Admin" : "User"}
                            </span>
                            {isCurrent && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/35 text-indigo-300 font-semibold font-sans tracking-normal">
                                (Bạn)
                              </span>
                            )}
                            {acc.is_active === false && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-medium font-sans tracking-normal">
                                Đã khóa
                              </span>
                            )}
                          </div>

                          {/* Activity Description */}
                          <div className="flex items-center gap-1.5 text-xs text-[#9ca3af] mt-0.5 font-sans tracking-normal font-normal">
                            <Activity
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isOnline ? "text-emerald-400" : "text-slate-500"
                              }`}
                            />
                            <span className="truncate max-w-[190px] sm:max-w-[260px]">
                              {isOnline
                                ? acc.current_activity || "Đang trực tuyến"
                                : "Chưa trực tuyến"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Online Status Badge & Time */}
                      <div className="text-right shrink-0">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium tracking-normal select-none">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            <span>Online</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/10 font-medium tracking-normal select-none">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                            <span>Offline</span>
                          </span>
                        )}
                        <div className="text-xs text-[#9ca3af] mt-1 font-sans tracking-normal font-normal">
                          {formatTimeAgo(acc.last_active_at, isOnline)}
                        </div>
                      </div>
                    </div>

                    {/* Device & IP Details */}
                    <div className="pt-2 border-t border-[#1f2937] flex items-center justify-between gap-2 text-xs text-[#9ca3af]">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex items-center gap-1 text-slate-300"
                          title={acc.last_device || (acc.devices && acc.devices[0]) || "Web Client"}
                        >
                          <Monitor className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-[120px] sm:max-w-[150px]">
                            {acc.last_device || (acc.devices && acc.devices[0]) || "Trình duyệt"}
                          </span>
                        </span>

                        <span
                          className="flex items-center gap-1 text-slate-300"
                          title={acc.last_ip || (acc.ips && acc.ips[acc.ips.length - 1]) || "127.0.0.1"}
                        >
                          <Globe className="h-3 w-3 text-indigo-400 shrink-0" />
                          <span className="font-mono">
                            {acc.last_ip || (acc.ips && acc.ips[acc.ips.length - 1]) || "127.0.0.1"}
                          </span>
                        </span>
                      </div>

                      <span className="text-xs text-[#6b7280] font-sans tracking-normal font-normal">
                        {isOnline ? "● Đang kết nối" : "● Ngắt kết nối"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#1f2937] flex items-center justify-between text-xs text-[#9ca3af]">
              <span className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Cơ chế Heartbeat: Ghi nhận tín hiệu hoạt động phiên thời gian thực</span>
              </span>
              <span className="font-mono text-xs text-emerald-300 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Live Polling (8s)</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Modal xác nhận xóa vĩnh viễn tài khoản */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#0b0f19] border border-[#1f2937] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác nhận xóa tài khoản</h3>
                <p className="text-xs text-[#9ca3af]">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản{" "}
              <strong className="font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                {deleteTargetUser}
              </strong>{" "}
              khỏi hệ thống? Quyền truy cập, thiết bị đăng nhập và dữ liệu phiên của người dùng này sẽ bị hủy bỏ hoàn toàn.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                disabled={isDeletingUser}
                className="px-4 py-2 rounded-xl border border-[#1f2937] bg-[#111827] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1f2937] transition cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAccount(deleteTargetUser)}
                disabled={isDeletingUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{isDeletingUser ? "Đang xóa..." : "Xác nhận xóa"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
