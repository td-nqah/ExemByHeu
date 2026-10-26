"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getAllProfiles,
  adminResetUserPassword,
  adminCreateAccount,
} from "@/lib/store";
import { Profile, AccountSecurity } from "@/types/exam";
import {
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  UserPlus,
  ChevronDown,
  Check,
  RefreshCw,
  Settings,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AdminSettingsPage() {
  const router = useRouter();

  // Profiles and accounts state
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [accountsSecurity, setAccountsSecurity] = useState<AccountSecurity[]>([]);

  // Card 1: Create Account State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createNotice, setCreateNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Card 2: Edit Account (Username & Password) State
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [editNewUsername, setEditNewUsername] = useState("");
  const [emergencyNewPassword, setEmergencyNewPassword] = useState("");
  const [showEmergencyPass, setShowEmergencyPass] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (selectedUser) {
      setEditNewUsername(selectedUser);
    }
  }, [selectedUser]);

  const selectedProfile = useMemo(
    () => allProfiles.find((p) => p.username === selectedUser),
    [allProfiles, selectedUser]
  );
  const selectedSecurity = useMemo(
    () => accountsSecurity.find((s) => s.username === selectedUser),
    [accountsSecurity, selectedUser]
  );

  const fetchAccountsSecurity = async () => {
    try {
      const res = await fetch("/api/admin/accounts");
      const data = await res.json();
      if (res.ok && data.accounts) {
        setAccountsSecurity(data.accounts);
      }
    } catch (err) {
      console.error("Failed to fetch accounts security:", err);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    async function loadInitialData() {
      const profiles = await getAllProfiles();
      setAllProfiles(profiles);
      if (profiles.length > 0 && !selectedUser) {
        setSelectedUser(profiles[0].username);
      }
      fetchAccountsSecurity();
    }

    loadInitialData();
  }, [router, selectedUser]);

  // Handle Form 1: Tạo tài khoản mới
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateNotice(null);

    const cleanUser = newUsername.trim().toLowerCase();
    const cleanPass = newPassword.trim();

    if (!cleanUser) {
      setCreateNotice({
        type: "error",
        message: "Vui lòng nhập tên tài khoản (username).",
      });
      return;
    }

    if (cleanPass.length < 4) {
      setCreateNotice({
        type: "error",
        message: "Mật khẩu phải có độ dài tối thiểu 4 ký tự.",
      });
      return;
    }

    setCreateLoading(true);
    try {
      const result = await adminCreateAccount(cleanUser, cleanPass, newRole);

      if (result.success) {
        setCreateNotice({
          type: "success",
          message: `Tài khoản "${cleanUser}" (${newRole}) đã được tạo thành công!`,
        });
        setNewUsername("");
        setNewPassword("");

        const updatedProfiles = await getAllProfiles();
        setAllProfiles(updatedProfiles);
        fetchAccountsSecurity();
      } else {
        setCreateNotice({
          type: "error",
          message: result.message || "Không thể tạo tài khoản. Vui lòng thử lại.",
        });
      }
    } catch {
      setCreateNotice({
        type: "error",
        message: "Lỗi kết nối máy chủ. Vui lòng thử lại sau.",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Form 2: Cập nhật Username & Mật khẩu
  const handleUserPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencyNotice(null);

    if (!selectedUser) {
      setEmergencyNotice({
        type: "error",
        message: "Vui lòng chọn tài khoản cần thay đổi thông tin.",
      });
      return;
    }

    const cleanEditUser = editNewUsername.trim().toLowerCase();
    const cleanPass = emergencyNewPassword.trim();

    if (!cleanEditUser) {
      setEmergencyNotice({
        type: "error",
        message: "Tên đăng nhập không được để trống.",
      });
      return;
    }

    if (cleanPass.length > 0 && cleanPass.length < 4) {
      setEmergencyNotice({
        type: "error",
        message: "Mật khẩu mới phải có tối thiểu 4 ký tự nếu thay đổi.",
      });
      return;
    }

    if (cleanEditUser === selectedUser && !cleanPass) {
      setEmergencyNotice({
        type: "error",
        message: "Bạn chưa nhập thay đổi nào cho Username hoặc Mật khẩu.",
      });
      return;
    }

    setEmergencyLoading(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUsername: selectedUser,
          newUsername: cleanEditUser !== selectedUser ? cleanEditUser : undefined,
          newPassword: cleanPass ? cleanPass : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEmergencyNotice({
          type: "success",
          message: `Đã cập nhật thành công tài khoản "${cleanEditUser}"!`,
        });
        setEmergencyNewPassword("");

        const updatedProfiles = await getAllProfiles();
        setAllProfiles(updatedProfiles);
        setSelectedUser(cleanEditUser);
        fetchAccountsSecurity();
      } else {
        setEmergencyNotice({
          type: "error",
          message: data.error || "Lỗi khi cập nhật tài khoản.",
        });
      }
    } catch {
      setEmergencyNotice({
        type: "error",
        message: "Lỗi kết nối máy chủ.",
      });
    } finally {
      setEmergencyLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1B1F2A]">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/40 leading-tight flex flex-wrap items-center gap-3">
            Cài đặt Hệ thống &amp; Tài khoản
            <span className="text-xs bg-[#10131B] text-[#9CA3AF] border border-[#252A37] px-3 py-1 rounded-full font-medium">
              System Admin
            </span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
            Tạo tài khoản người dùng, cấp quyền Quản trị viên và quản lý bảo mật xác thực của toàn bộ hệ thống ExamByHeu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAccountsSecurity}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#252A37] bg-[#10131B] text-xs font-semibold text-white hover:bg-[#161A24] transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Đồng bộ tài khoản</span>
          </button>
        </div>
      </div>

      {/* 2 CARDS SEPARATE LAYOUT (EQUAL HEIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* =========================================================================
            CARD 1: TẠO TÀI KHOẢN MỚI
            ========================================================================= */}
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-6 sm:p-7 flex flex-col justify-between h-full shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#252A37]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#10131B] border border-[#252A37] text-white shadow-sm">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Tạo tài khoản mới
                  </h2>
                  <p className="text-xs text-[#9CA3AF]">
                    Cấp phát tài khoản đăng nhập cho Quản trị viên hoặc User
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 mt-5">
              {createNotice && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-start gap-2 shadow-sm ${
                    createNotice.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                      : "bg-rose-500/10 border border-rose-500/25 text-rose-300"
                  }`}
                >
                  {createNotice.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{createNotice.message}</span>
                </div>
              )}

              {/* Tên tài khoản */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-white" />
                  <span>Tên đăng nhập (Username)</span>
                </label>
                <input
                  type="text"
                  name="new_account_username"
                  autoComplete="off"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                  placeholder="VD: sinhvien_01 hoặc trogiang"
                  className="w-full px-4 py-2.5 bg-[#10131B] border border-[#252A37] rounded-full text-xs text-white placeholder-[#8B93A5] focus:outline-none focus:border-white/50 transition-colors font-mono"
                />
              </div>

              {/* Mật khẩu khởi tạo */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5] flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-white" />
                  <span>Mật khẩu khởi tạo</span>
                </label>
                <div className="relative">
                  <input
                    type={showCreatePass ? "text" : "password"}
                    name="new_account_password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (tối thiểu 4 ký tự)"
                    className="w-full px-4 py-2.5 bg-[#10131B] border border-[#252A37] rounded-full text-xs text-white placeholder-[#8B93A5] focus:outline-none focus:border-white/50 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePass(!showCreatePass)}
                    className="absolute right-3.5 top-2.5 text-[#8B93A5] hover:text-white transition-colors cursor-pointer"
                  >
                    {showCreatePass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Vai trò / Phân quyền */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5] flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-white" />
                  <span>Vai trò phân quyền</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("user")}
                    className={`py-2.5 px-3 rounded-full border text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newRole === "user"
                        ? "bg-white text-black font-bold border-transparent shadow-sm"
                        : "bg-[#10131B] border-[#252A37] text-[#9CA3AF] hover:text-white"
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole("admin")}
                    className={`py-2.5 px-3 rounded-full border text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newRole === "admin"
                        ? "bg-white text-black font-bold border-transparent shadow-sm"
                        : "bg-[#10131B] border-[#252A37] text-[#9CA3AF] hover:text-white"
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Quản trị viên (Admin)</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-200 text-[#05070D] font-bold text-xs rounded-full shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  {createLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-black" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5 text-black" />
                      <span>Tạo tài khoản ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 pt-3 border-t border-[#252A37] text-xs text-[#9CA3AF] font-mono flex items-center justify-between">
            <span>Bảo mật: Mật khẩu được mã hóa an toàn qua Bcrypt</span>
            <span className="text-[#8B93A5]">Auto-Hashed</span>
          </div>
        </div>

        {/* =========================================================================
            CARD 2: ĐỔI MẬT KHẨU CÁC TÀI KHOẢN
            ========================================================================= */}
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-6 sm:p-7 flex flex-col justify-between h-full shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#252A37]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#10131B] border border-[#252A37] text-white shadow-sm">
                  <KeyRound className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Đổi Username &amp; Mật khẩu
                  </h2>
                  <p className="text-xs text-[#9CA3AF]">
                    Đổi tên đăng nhập hoặc đặt lại mật khẩu cho bất kỳ tài khoản nào trong hệ thống
                  </p>
                </div>
              </div>

              <span className="text-xs px-3 py-1 rounded-full font-mono bg-[#10131B] border border-[#252A37] text-[#9CA3AF]">
                {allProfiles.length} tài khoản
              </span>
            </div>

            <form onSubmit={handleUserPasswordReset} className="space-y-4 mt-5">
              {emergencyNotice && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-start gap-2 shadow-sm ${
                    emergencyNotice.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300"
                      : "bg-rose-500/10 border border-rose-500/25 text-rose-300"
                  }`}
                >
                  {emergencyNotice.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{emergencyNotice.message}</span>
                </div>
              )}

              {/* Custom Popover Select User */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5] flex items-center justify-between">
                  <span>Chọn tài khoản cần đổi mật khẩu:</span>
                  <span className="text-xs font-mono text-[#8B93A5]">
                    ({allProfiles.length} tài khoản)
                  </span>
                </label>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="w-full px-4 py-2.5 bg-[#10131B] border border-[#252A37] hover:border-white/30 rounded-full text-xs text-white flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {(() => {
                      const prof = allProfiles.find((p) => p.username === selectedUser);
                      const isAdmin = prof?.role === "admin";
                      return (
                        <div
                          className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border border-[#252A37] bg-[#161A24] text-white"
                        >
                          {isAdmin ? (
                            <Shield className="h-3.5 w-3.5" />
                          ) : (
                            <User className="h-3.5 w-3.5" />
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-white">
                        {selectedUser || "Chưa chọn tài khoản"}
                      </span>
                      {(() => {
                        const prof = allProfiles.find((p) => p.username === selectedUser);
                        const isAdmin = prof?.role === "admin";
                        return (
                          <span
                            className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-[#161A24] border border-[#252A37] text-white"
                          >
                            {isAdmin ? "Quản trị viên" : "User"}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(() => {
                      const sec = accountsSecurity.find((a) => a.username === selectedUser);
                      const isActive = sec ? sec.is_active !== false : true;
                      return (
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium flex items-center gap-1 border ${
                            isActive
                              ? "bg-[#232836] text-white border-[#2A2F3C]"
                              : "bg-[#232836] text-rose-400 border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-emerald-400" : "bg-rose-400"
                            }`}
                          />
                          <span>{isActive ? "Active" : "Khóa"}</span>
                        </span>
                      );
                    })()}
                    <ChevronDown
                      className={`h-4 w-4 text-[#8B93A5] transition-transform duration-200 transform ${
                        isUserDropdownOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Dropdown Floating Popover */}
                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      role="listbox"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-3xl bg-[#0A0C12] border border-[#252A37] shadow-2xl p-2 space-y-1"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-[#8B93A5] uppercase tracking-wider border-b border-[#1B1F2A] flex items-center justify-between pb-1.5">
                        <span>Danh sách tài khoản</span>
                        <span className="font-mono text-slate-500 lowercase">
                          {allProfiles.length} tài khoản
                        </span>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 py-1 pr-1 custom-scrollbar">
                        {allProfiles.map((p) => {
                          const isSelected = p.username === selectedUser;
                          const sec = accountsSecurity.find((a) => a.username === p.username);
                          const isActive = sec ? sec.is_active !== false : true;
                          const isAdmin = p.role === "admin";

                          return (
                            <button
                              key={p.username}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setSelectedUser(p.username);
                                setIsUserDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-2xl text-left transition-all duration-150 flex items-center justify-between gap-2.5 group cursor-pointer border ${
                                isSelected
                                  ? "bg-white text-black border-transparent shadow-sm"
                                  : "hover:bg-[#161A24] text-slate-300 hover:text-white border-transparent bg-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 border ${
                                    isSelected
                                      ? "bg-black/10 border-transparent text-black"
                                      : "bg-[#10131B] border-[#252A37] text-white"
                                  }`}
                                >
                                  {isAdmin ? (
                                    <Shield className="h-3.5 w-3.5" />
                                  ) : (
                                    <User className="h-3.5 w-3.5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-mono text-xs font-bold tracking-wide ${
                                        isSelected ? "text-black" : "text-white"
                                      }`}
                                    >
                                      {p.username}
                                    </span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold border ${
                                        isSelected
                                          ? "bg-black/10 text-black border-transparent"
                                          : "bg-[#10131B] text-[#9CA3AF] border-[#252A37]"
                                      }`}
                                    >
                                      {isAdmin ? "Quản trị viên" : "User"}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#9CA3AF] font-mono flex items-center gap-2 mt-0.5">
                                    <span
                                      className={`flex items-center gap-1 ${
                                        isActive ? "text-[#34d399]" : "text-rose-400"
                                      }`}
                                    >
                                      <span
                                        className={`h-1 w-1 rounded-full ${
                                          isActive ? "bg-[#34d399]" : "bg-rose-400"
                                        }`}
                                      />
                                      <span>{isActive ? "Active" : "Đã khóa"}</span>
                                    </span>
                                    {sec && (
                                      <span className="text-slate-500 font-mono text-[9px]">
                                        • {sec.devices?.length || 0}/3 thiết bị
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 pl-1">
                                {isSelected && (
                                  <div className="h-5 w-5 rounded-full bg-black/10 flex items-center justify-center text-black">
                                    <Check className="h-3 w-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Thông tin & Phân quyền hiện tại của tài khoản được chọn */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5] flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-white" />
                  <span>Vai trò &amp; Trạng thái tài khoản</span>
                </label>
                <div className="px-4 py-2.5 rounded-2xl bg-[#10131B] border border-[#252A37] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">
                      {selectedUser || "..."}
                    </span>
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full border border-[#252A37] bg-[#161A24] text-white font-mono"
                    >
                      {selectedProfile?.role === "admin" ? "Quản trị viên (Admin)" : "User"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#9CA3AF] font-mono">
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span>{selectedSecurity?.is_active !== false ? "Active" : "Đã khóa"}</span>
                    </span>
                    {selectedSecurity && (
                      <span>
                        • {selectedSecurity.devices?.length || 0}/3 thiết bị
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tên đăng nhập mới */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5] flex items-center justify-between">
                  <span>Tên đăng nhập (Username)</span>
                  <span className="text-xs text-[#9CA3AF]">Có thể đổi mới hoặc giữ nguyên</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editNewUsername}
                    onChange={(e) => setEditNewUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập mới"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#10131B] border border-[#252A37] rounded-full text-xs text-white placeholder-[#8B93A5] focus:outline-none focus:border-white/50 transition-colors font-mono"
                  />
                  <User className="pointer-events-none absolute left-3.5 top-2.5 z-10 h-4 w-4 text-[#8B93A5]" />
                </div>
              </div>

              {/* Mật khẩu mới cho tài khoản */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5] flex items-center justify-between">
                  <span>Mật khẩu mới</span>
                  <span className="text-xs text-[#9CA3AF]">Để trống nếu không đổi mật khẩu</span>
                </label>
                <div className="relative">
                  <input
                    type={showEmergencyPass ? "text" : "password"}
                    name="emergency_new_password"
                    autoComplete="new-password"
                    value={emergencyNewPassword}
                    onChange={(e) => setEmergencyNewPassword(e.target.value)}
                    placeholder="Để trống nếu không đổi mật khẩu"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#10131B] border border-[#252A37] rounded-full text-xs text-white placeholder-[#8B93A5] focus:outline-none focus:border-white/50 transition-colors"
                  />
                  <Lock className="pointer-events-none absolute left-3.5 top-2.5 z-10 h-4 w-4 text-[#8B93A5]" />
                  <button
                    type="button"
                    onClick={() => setShowEmergencyPass(!showEmergencyPass)}
                    className="absolute right-3.5 top-2.5 z-10 text-[#8B93A5] hover:text-white transition-colors cursor-pointer"
                  >
                    {showEmergencyPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={emergencyLoading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-200 text-[#05070D] font-bold text-xs rounded-full shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  {emergencyLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-black" />
                      <span>Đang lưu thay đổi...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5 text-black" />
                      <span>Lưu thay đổi (Username &amp; Mật khẩu)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-5 pt-3 border-t border-[#252A37] text-xs text-[#9CA3AF] font-mono flex items-center justify-between">
            <span>Hiệu lực: Cập nhật thông tin tài khoản ngay tức thì</span>
            <span className="text-[#8B93A5]">Instant-Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
}
