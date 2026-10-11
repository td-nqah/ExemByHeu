"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  getCurrentUser,
  getLoginAuditLogs,
  getAllProfiles,
  adminResetUserPassword,
  loginUser,
  LoginAuditLog,
} from "@/lib/store";
import { Profile } from "@/types/exam";
import { formatDate } from "@/lib/utils";
import {
  Settings,
  Shield,
  Activity,
  HardDrive,
  KeyRound,
  Lock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  Laptop,
  Globe,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Database,
  Server,
  Zap,
  Users,
  ShieldAlert,
  Sliders,
} from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "analytics" | "storage" | "passwords">("all");

  // SECTION 1: Analytics & Audit Logs State
  const [auditLogs, setAuditLogs] = useState<LoginAuditLog[]>([]);
  const [logFilter, setLogFilter] = useState<"all" | "success" | "failed">("all");
  const [searchLogUser, setSearchLogUser] = useState("");
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  // SECTION 2: Storage State
  const [usedStorageMB, setUsedStorageMB] = useState(245.8);
  const maxStorageMB = 500;
  const isHighStorage = (usedStorageMB / maxStorageMB) >= 0.8;

  // SECTION 3: Admin Self Password State
  const [oldAdminPassword, setOldAdminPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [adminPassLoading, setAdminPassLoading] = useState(false);
  const [adminPassNotice, setAdminPassNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // SECTION 3: Emergency User Reset State
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("user1");
  const [emergencyNewPassword, setEmergencyNewPassword] = useState("");
  const [showEmergencyPass, setShowEmergencyPass] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Security Check: Only admin allowed
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    // Initial data load
    setAuditLogs(getLoginAuditLogs());
    loadProfiles();
  }, [router]);

  async function loadProfiles() {
    const profiles = await getAllProfiles();
    setAllProfiles(profiles);
    if (profiles.length > 0 && !profiles.some((p) => p.username === selectedUser)) {
      setSelectedUser(profiles[0].username);
    }
  }

  const handleRefreshLogs = () => {
    setIsRefreshingLogs(true);
    setTimeout(() => {
      setAuditLogs(getLoginAuditLogs());
      setIsRefreshingLogs(false);
    }, 400);
  };

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchFilter =
        logFilter === "all" ? true : log.status === logFilter;
      const matchSearch =
        searchLogUser.trim() === ""
          ? true
          : log.username.toLowerCase().includes(searchLogUser.toLowerCase()) ||
            log.ip_address.includes(searchLogUser) ||
            log.device.toLowerCase().includes(searchLogUser.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [auditLogs, logFilter, searchLogUser]);

  // Filtered Profiles for Search
  const filteredProfiles = useMemo(() => {
    if (!userSearchTerm.trim()) return allProfiles;
    return allProfiles.filter((p) =>
      p.username.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [allProfiles, userSearchTerm]);

  // Handle Admin Change Password
  const handleAdminChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassNotice(null);

    if (!oldAdminPassword || !newAdminPassword || !confirmAdminPassword) {
      setAdminPassNotice({
        type: "error",
        message: "Vui lòng điền đầy đủ tất cả các trường mật khẩu.",
      });
      return;
    }

    if (newAdminPassword.length < 3) {
      setAdminPassNotice({
        type: "error",
        message: "Mật khẩu mới phải có tối thiểu 3 ký tự.",
      });
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setAdminPassNotice({
        type: "error",
        message: "Mật khẩu mới và xác nhận mật khẩu không khớp.",
      });
      return;
    }

    setAdminPassLoading(true);
    try {
      // Verify old admin password
      const verify = await loginUser(currentUser?.username || "admin", oldAdminPassword);
      if (!verify) {
        setAdminPassNotice({
          type: "error",
          message: "Mật khẩu hiện tại không chính xác. Vui lòng thử lại.",
        });
        setAdminPassLoading(false);
        return;
      }

      // Update password via API
      const result = await adminResetUserPassword(
        currentUser?.username || "admin",
        newAdminPassword
      );

      if (result.success) {
        setAdminPassNotice({
          type: "success",
          message: "Đổi mật khẩu tài khoản Admin thành công! Mật khẩu mới đã được lưu an toàn.",
        });
        setOldAdminPassword("");
        setNewAdminPassword("");
        setConfirmAdminPassword("");
      } else {
        setAdminPassNotice({
          type: "error",
          message: result.message || "Không thể đổi mật khẩu.",
        });
      }
    } catch {
      setAdminPassNotice({
        type: "error",
        message: "Đã xảy ra sự cố trong quá trình đổi mật khẩu.",
      });
    } finally {
      setAdminPassLoading(false);
    }
  };

  // Handle Emergency Reset for any user
  const handleEmergencyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencyNotice(null);

    if (!selectedUser) {
      setEmergencyNotice({
        type: "error",
        message: "Vui lòng chọn tài khoản cần đặt lại mật khẩu.",
      });
      return;
    }

    if (!emergencyNewPassword || emergencyNewPassword.trim().length === 0) {
      setEmergencyNotice({
        type: "error",
        message: "Vui lòng nhập mật khẩu mới cho tài khoản được chọn.",
      });
      return;
    }

    setEmergencyLoading(true);
    try {
      const result = await adminResetUserPassword(
        selectedUser,
        emergencyNewPassword.trim()
      );

      if (result.success) {
        setEmergencyNotice({
          type: "success",
          message: `Đã cập nhật mật khẩu cho tài khoản '${selectedUser}' thành công vào CSDL Supabase!`,
        });
        setEmergencyNewPassword("");
        loadProfiles();
      } else {
        setEmergencyNotice({
          type: "error",
          message: result.message || "Không thể cập nhật mật khẩu.",
        });
      }
    } catch {
      setEmergencyNotice({
        type: "error",
        message: "Lỗi kết nối khi cập nhật mật khẩu khẩn cấp.",
      });
    } finally {
      setEmergencyLoading(false);
    }
  };

  const getDeviceIcon = (deviceStr: string) => {
    if (deviceStr.toLowerCase().includes("iphone") || deviceStr.toLowerCase().includes("android")) {
      return <Smartphone className="h-4 w-4 text-emerald-400 shrink-0" />;
    }
    if (deviceStr.toLowerCase().includes("mac") || deviceStr.toLowerCase().includes("windows")) {
      return <Laptop className="h-4 w-4 text-indigo-400 shrink-0" />;
    }
    return <Globe className="h-4 w-4 text-slate-400 shrink-0" />;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 inline-flex shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Settings className="h-6 w-6" />
            </span>
            Cài đặt Hệ thống & Bảo mật
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-medium">
              Admin Control Center
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Giám sát lưu lượng truy cập, nhật ký đăng nhập an toàn, dung lượng CSDL và quản lý mật khẩu toàn quyền.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Nhật ký & Truy cập
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "storage"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Bộ nhớ & Tài nguyên
          </button>
          <button
            onClick={() => setActiveTab("passwords")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "passwords"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Quản lý Mật khẩu
          </button>
        </div>
      </motion.div>

      {/* =========================================================================
          SECTION 1: GIÁM SÁT LƯỢNG TRUY CẬP & NHẬT KÝ ĐĂNG NHẬP
          ========================================================================= */}
      {(activeTab === "all" || activeTab === "analytics") && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              1. Giám sát Truy cập & Nhật ký Đăng nhập
            </h2>
            <span className="text-xs text-slate-400">Thời gian thực (Real-time Audit)</span>
          </div>

          {/* Real-time Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 hover:border-indigo-500/30 transition-all rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Lượng truy cập trong ngày</span>
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Globe className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">148</span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  +18.4%
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Tổng số lượt tải trang & phiên thi</p>
            </div>

            <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 hover:border-emerald-500/30 transition-all rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tài khoản đang Online</span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">3</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Đang hoạt động
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">admin, user1, user2 trực tuyến</p>
            </div>

            <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 hover:border-cyan-500/30 transition-all rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Thời gian phản hồi</span>
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Zap className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">38ms</span>
                <span className="text-xs font-medium text-cyan-400">Cực nhanh</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Độ trễ Supabase Edge Gateway</p>
            </div>

            <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 hover:border-violet-500/30 transition-all rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Độ sẵn sàng (Uptime)</span>
                <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Server className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">99.98%</span>
                <span className="text-xs font-medium text-violet-400">Tiêu chuẩn</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Hệ thống duy trì 30 ngày qua</p>
            </div>
          </div>

          {/* Audit Logs Card */}
          <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Nhật ký Đăng nhập (Login Audit Logs)</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                    {filteredLogs.length} sự kiện
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Theo dõi danh tính, địa chỉ IP, thiết bị và thời điểm đăng nhập vào hệ thống
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search Box */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchLogUser}
                    onChange={(e) => setSearchLogUser(e.target.value)}
                    placeholder="Tìm tài khoản, IP, thiết bị..."
                    className="pl-8 pr-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
                  />
                </div>

                {/* Filter Status */}
                <div className="flex items-center gap-1 bg-slate-900/80 border border-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setLogFilter("all")}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      logFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setLogFilter("success")}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      logFilter === "success" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-emerald-400"
                    }`}
                  >
                    Thành công
                  </button>
                  <button
                    onClick={() => setLogFilter("failed")}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      logFilter === "failed" ? "bg-rose-500/20 text-rose-300" : "text-slate-400 hover:text-rose-400"
                    }`}
                  >
                    Thất bại
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={handleRefreshLogs}
                  disabled={isRefreshingLogs}
                  className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                  title="Làm mới danh sách"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingLogs ? "animate-spin text-indigo-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Tài khoản</th>
                    <th className="py-3 px-4">Địa chỉ IP</th>
                    <th className="py-3 px-4">Thiết bị & Trình duyệt</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                        Không có dữ liệu nhật ký phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2 font-sans">
                            <span className="p-1 rounded bg-slate-800 text-indigo-300 border border-white/10">
                              <UserCheck className="h-3.5 w-3.5" />
                            </span>
                            <span className="font-mono text-sm">{log.username}</span>
                            {log.username === "admin" && (
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-sans font-medium">
                                Quản trị
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-white/5 text-[11px]">
                            {log.ip_address}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-sans">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(log.device)}
                            <span className="truncate max-w-[220px]">{log.device}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-sans">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {log.status === "success" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-sans font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertCircle className="h-3 w-3" />
                              Thất bại
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      )}

      {/* =========================================================================
          SECTION 2: THEO DÕI DUNG LƯỢNG BỘ NHỚ
          ========================================================================= */}
      {(activeTab === "all" || activeTab === "storage") && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-indigo-400" />
              2. Theo dõi Dung lượng Bộ nhớ & Tài nguyên
            </h2>
            <span className="text-xs text-slate-400">Gói Supabase Free Tier (500 MB)</span>
          </div>

          <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 space-y-6">
            {/* Warning Banner if > 80% */}
            {isHighStorage ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-start gap-3 animate-pulse">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-rose-300">CẢNH BÁO: Dung lượng bộ nhớ đã vượt quá 80%!</h4>
                  <p className="text-xs text-rose-300/80 mt-1">
                    Cơ sở dữ liệu sắp chạm ngưỡng giới hạn 500 MB của gói miễn phí. Vui lòng dọn dẹp các tệp đính kèm cũ hoặc nâng cấp gói dịch vụ để đảm bảo kỳ thi diễn ra thông suốt.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-white">Dung lượng trong ngưỡng an toàn</h4>
                    <p className="text-xs text-slate-400">
                      Hệ thống đang hoạt động tối ưu với {(usedStorageMB / maxStorageMB * 100).toFixed(1)}% dung lượng khả dụng.
                    </p>
                  </div>
                </div>

                {/* Simulation toggle button */}
                <button
                  onClick={() => setUsedStorageMB(prev => prev > 350 ? 245.8 : 425.5)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                  {usedStorageMB > 350 ? "Đặt lại bình thường" : "Mô phỏng cảnh báo > 80%"}
                </button>
              </div>
            )}

            {/* Storage Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-400" />
                  Tổng Dung lượng CSDL & Tệp lưu trữ:
                </span>
                <span className="text-sm font-mono font-bold text-white">
                  <span className={isHighStorage ? "text-rose-400" : "text-indigo-400"}>
                    {usedStorageMB.toFixed(1)} MB
                  </span>{" "}
                  / {maxStorageMB} MB{" "}
                  <span className="text-xs text-slate-400 font-sans">
                    ({((usedStorageMB / maxStorageMB) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>

              {/* Bar track */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isHighStorage
                      ? "bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                      : "bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                  }`}
                  style={{ width: `${Math.min(100, (usedStorageMB / maxStorageMB) * 100)}%` }}
                />
              </div>
            </div>

            {/* Resource Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Bảng CSDL PostgreSQL</span>
                  <span className="font-mono text-white font-semibold">85.4 MB</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full" style={{ width: "35%" }} />
                </div>
                <p className="text-[11px] text-slate-500 pt-1">Đề thi, câu hỏi, nộp bài, audit</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Kho Tệp & Đính kèm (Storage)</span>
                  <span className="font-mono text-white font-semibold">124.2 MB</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full rounded-full" style={{ width: "50%" }} />
                </div>
                <p className="text-[11px] text-slate-500 pt-1">Ảnh đề thi, file docx/xlsx tải lên</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Băng thông tháng này</span>
                  <span className="font-mono text-white font-semibold">1.8 / 5.0 GB</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: "36%" }} />
                </div>
                <p className="text-[11px] text-slate-500 pt-1">Băng thông truyền tải mạng</p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* =========================================================================
          SECTION 3: QUẢN LÝ MẬT KHẨU TOÀN DIỆN
          ========================================================================= */}
      {(activeTab === "all" || activeTab === "passwords") && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-400" />
              3. Quản lý Mật khẩu Toàn diện (Password Management)
            </h2>
            <span className="text-xs text-slate-400">Mã hóa Bcrypt an toàn</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SUB-SECTION 1: Đổi mật khẩu tài khoản Admin hiện tại */}
            <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Đổi mật khẩu Admin hiện tại</h3>
                    <p className="text-xs text-slate-400">
                      Tài khoản: <strong className="text-indigo-400 font-mono">{currentUser?.username || "admin"}</strong>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAdminChangePassword} className="space-y-4 mt-5">
                  {adminPassNotice && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                        adminPassNotice.type === "success"
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                          : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                      }`}
                    >
                      {adminPassNotice.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                      )}
                      <span>{adminPassNotice.message}</span>
                    </div>
                  )}

                  {/* Old Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPass ? "text" : "password"}
                        value={oldAdminPassword}
                        onChange={(e) => setOldAdminPassword(e.target.value)}
                        placeholder="Nhập mật khẩu admin hiện tại (mặc định: 123)"
                        className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={confirmAdminPassword}
                      onChange={(e) => setConfirmAdminPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={adminPassLoading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {adminPassLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Đang lưu mật khẩu...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Cập nhật mật khẩu Admin
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <p className="mt-4 text-[11px] text-slate-500 border-t border-white/5 pt-3">
                * Lưu ý: Mật khẩu mới sẽ được cập nhật đồng bộ vào Supabase Database Profiles.
              </p>
            </div>

            {/* SUB-SECTION 2: Đặt lại Mật khẩu Khẩn cấp cho TẤT CẢ các tài khoản */}
            <div className="bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Đặt lại Mật khẩu Khẩn cấp (Toàn quyền)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ghi đè mật khẩu cho bất kỳ tài khoản nào: <code className="text-amber-400">user1, user2, user3...</code>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleEmergencyReset} className="space-y-4 mt-5">
                  {emergencyNotice && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                        emergencyNotice.type === "success"
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                          : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                      }`}
                    >
                      {emergencyNotice.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                      )}
                      <span>{emergencyNotice.message}</span>
                    </div>
                  )}

                  {/* Select or Search User */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">
                        Chọn tài khoản cần đặt lại
                      </label>
                      <span className="text-[11px] text-slate-500">
                        ({allProfiles.length} tài khoản trong hệ thống)
                      </span>
                    </div>

                    {/* Quick Profile Select */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {allProfiles.map((p) => {
                        const isSelected = selectedUser === p.username;
                        return (
                          <button
                            key={p.username}
                            type="button"
                            onClick={() => setSelectedUser(p.username)}
                            className={`p-2 rounded-xl text-left border transition-all ${
                              isSelected
                                ? "bg-amber-500/15 border-amber-500/50 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                                : "bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-white">
                                {p.username}
                              </span>
                              {isSelected && (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {p.role === "admin" ? "Quản trị viên" : "Thí sinh"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Search User Dropdown if large */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Hoặc tìm kiếm tài khoản cụ thể
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {allProfiles.map((p) => (
                        <option key={p.username} value={p.username} className="bg-slate-900 text-white">
                          {p.username} ({p.role === "admin" ? "Admin" : "Thí sinh"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* New Emergency Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Mật khẩu mới thay thế cho <strong className="text-amber-400 font-mono">[{selectedUser}]</strong>
                    </label>
                    <div className="relative">
                      <input
                        type={showEmergencyPass ? "text" : "password"}
                        value={emergencyNewPassword}
                        onChange={(e) => setEmergencyNewPassword(e.target.value)}
                        placeholder={`Nhập mật khẩu mới cho ${selectedUser}`}
                        className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmergencyPass(!showEmergencyPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showEmergencyPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={emergencyLoading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {emergencyLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Đang cập nhật CSDL...
                        </>
                      ) : (
                        <>
                          <KeyRound className="h-4 w-4" />
                          Cập nhật mật khẩu ngay
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <p className="mt-4 text-[11px] text-slate-500 border-t border-white/5 pt-3">
                * Hành động này sử dụng khóa Service Role để ghi đè mật khẩu trực tiếp, không yêu cầu mã OTP hay xác nhận email của thí sinh.
              </p>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
