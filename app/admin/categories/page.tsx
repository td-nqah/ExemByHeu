"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  getCurrentUser,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getExams,
} from "@/lib/store";
import { Category, Exam } from "@/types/exam";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  BookText,
  Boxes,
  Code2,
  Cpu,
  Sparkles,
  Languages,
  BookOpen,
  GraduationCap,
  FileText,
  StickyNote,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PopoverSelect } from "@/components/ui/PopoverSelect";

// Icon options for categories
const AVAILABLE_ICONS = [
  { label: "Sách giáo trình (BookText)", value: "BookText", icon: BookText },
  { label: "Hộp đối tượng (Boxes)", value: "Boxes", icon: Boxes },
  { label: "Mã nguồn Web (Code2)", value: "Code2", icon: Code2 },
  { label: "Lập trình & Phần cứng (Cpu)", value: "Cpu", icon: Cpu },
  { label: "Ghi chú & Cẩm nang (StickyNote)", value: "StickyNote", icon: StickyNote },
  { label: "Văn bản & Tài liệu (FileText)", value: "FileText", icon: FileText },
  { label: "Lấp lánh / Triết học (Sparkles)", value: "Sparkles", icon: Sparkles },
  { label: "Ngoại ngữ (Languages)", value: "Languages", icon: Languages },
  { label: "Mở sách (BookOpen)", value: "BookOpen", icon: BookOpen },
  { label: "Mũ cử nhân (GraduationCap)", value: "GraduationCap", icon: GraduationCap },
];

export default function AdminCategoriesPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [categories, setCategories] = useState<Category[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState("BookText");
  const [formStatus, setFormStatus] = useState<"active" | "hidden">("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    async function loadData() {
      try {
        const [cats, allExams] = await Promise.all([
          getCategories(false),
          getExams(false),
        ]);
        setCategories(cats);
        setExams(allExams);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormIcon("BookText");
    setFormStatus("active");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormIcon(cat.icon || "BookText");
    setFormStatus(cat.status || "active");
    setIsModalOpen(true);
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      setFormSlug(generateSlugFromName(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, {
          name: formName.trim(),
          slug: formSlug.trim().toLowerCase(),
          icon: formIcon,
          status: formStatus,
        });
        if (updated) {
          setCategories((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        }
      } else {
        const created = await createCategory({
          name: formName.trim(),
          slug: formSlug.trim().toLowerCase(),
          icon: formIcon,
          status: formStatus,
        });
        setCategories((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    const nextStatus = cat.status === "active" ? "hidden" : "active";
    const updated = await updateCategory(cat.id, { status: nextStatus });
    if (updated) {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? updated : c))
      );
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
  };

  const getExamCountForCategory = (slug: string) => {
    return exams.filter(
      (e) =>
        e.category_slug === slug ||
        (slug === "cnxh" &&
          (e.title.toLowerCase().includes("cnxh") ||
            e.title.toLowerCase().includes("chủ nghĩa xã hội")))
    ).length;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header Block */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/40 leading-tight flex flex-wrap items-center gap-3">
              Quản lý Danh mục Học phần
              <span className="text-xs bg-[#10131B] text-[#9CA3AF] border border-[#252A37] px-3 py-1 rounded-full font-mono">
                Course Management
              </span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#9CA3AF] max-w-xl leading-relaxed">
              Tạo mới, cập nhật hoặc điều chỉnh trạng thái hiển thị các danh mục học phần trong chương trình đào tạo.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-200 active:scale-95 text-[#05070D] font-bold px-5 py-2.5 text-xs transition-all self-start md:self-auto select-none shadow-lg cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Học phần mới</span>
          </button>
        </div>
      </motion.div>

      {/* 2. Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-5 shadow-xl">
          <span className="text-xs text-[#8B93A5] uppercase tracking-wider font-mono font-bold">Tổng số học phần</span>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono tracking-tight">{categories.length}</div>
        </div>
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-5 shadow-xl">
          <span className="text-xs text-[#8B93A5] uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Đang kích hoạt (Active)
          </span>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono tracking-tight">
            {categories.filter((c) => c.status === "active").length}
          </div>
        </div>
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-5 shadow-xl">
          <span className="text-xs text-[#8B93A5] uppercase tracking-wider font-mono font-bold">Đang ẩn (Hidden)</span>
          <div className="mt-2 text-3xl font-extrabold text-[#9CA3AF] font-mono tracking-tight">
            {categories.filter((c) => c.status === "hidden").length}
          </div>
        </div>
      </div>

      {/* 3. Categories Table */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl border border-[#252A37] bg-[#161A24] overflow-hidden shadow-xl"
      >
        <div className="p-4 sm:p-5 border-b border-[#252A37] flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-white" />
            <span>Danh sách Học phần ({categories.length})</span>
          </h2>
          <span className="text-xs text-[#9CA3AF]">Đồng bộ với phân hệ khảo thí và điều hướng</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#9CA3AF]">Đang tải danh mục học phần...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-[#9CA3AF]">Chưa có học phần nào trong danh mục.</p>
            <button
              onClick={openCreateModal}
              className="px-5 py-2 bg-white text-black font-bold rounded-full text-xs hover:bg-slate-200 transition"
            >
              Thêm học phần đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#252A37] bg-[#10131B] text-[#8B93A5] font-heading uppercase tracking-wide text-xs font-bold">
                  <th className="py-3.5 px-4">Tên Học phần</th>
                  <th className="py-3.5 px-4">Mã Học phần (Slug)</th>
                  <th className="py-3.5 px-4">Biểu tượng đại diện</th>
                  <th className="py-3.5 px-4 text-center">Số đề đánh giá</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A37]">
                {categories.map((cat, idx) => {
                  const examCount = getExamCountForCategory(cat.slug);
                  return (
                    <tr
                      key={cat.id}
                      className={cn(
                        "transition-colors",
                        idx % 2 === 0 ? "bg-[#141824]" : "bg-[#161A24]",
                        "hover:bg-[#191E2B]"
                      )}
                    >
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <span className="p-1.5 rounded-xl bg-[#10131B] text-white border border-[#252A37]">
                            <BookText className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-bold text-white">{cat.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#10131B] border border-[#252A37] text-white text-[11px] font-mono">
                          {cat.slug}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#9CA3AF] text-xs font-mono">
                        {cat.icon || "BookText"}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#10131B] border border-[#252A37] text-white font-bold font-mono text-xs">
                          {examCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer",
                            cat.status === "active"
                              ? "bg-[#232836] text-white border-[#2A2F3C] hover:border-white/30"
                              : "bg-[#10131B] text-[#9CA3AF] border-[#252A37] hover:border-white/30"
                          )}
                          title="Bấm để đổi trạng thái"
                        >
                          {cat.status === "active" ? (
                            <>
                              <Eye className="h-3 w-3 text-emerald-400" />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 text-[#8B93A5]" />
                              <span>Đang ẩn</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-full text-[#9CA3AF] hover:text-white hover:bg-[#10131B] transition cursor-pointer"
                            title="Chỉnh sửa học phần"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {deleteConfirmId === cat.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(cat.id)}
                                className="px-2.5 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Xóa ngay
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1 rounded-full text-[#9CA3AF] hover:text-white cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(cat.id)}
                              className="p-1.5 rounded-full text-[#9CA3AF] hover:text-rose-400 hover:bg-[#10131B] transition cursor-pointer"
                              title="Xóa học phần"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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
      </motion.div>

      {/* 4. Modal: Create / Edit Category */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-[#252A37] bg-[#161A24] p-6 sm:p-7 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#252A37]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-white" />
                  <span>
                    {editingCategory ? "Cập nhật Học phần" : "Thêm Học phần mới"}
                  </span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full text-[#9CA3AF] hover:text-white hover:bg-[#10131B] transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-5">
                {/* Category Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
                    Tên Học phần *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ví dụ: Chủ nghĩa xã hội khoa học"
                    className="w-full px-4 py-2.5 bg-[#10131B] border border-[#252A37] rounded-full text-xs text-white placeholder-[#8B93A5] focus:outline-none focus:border-white/50 transition-colors"
                  />
                </div>

                {/* Slug / Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
                    Mã Học phần (Slug / Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="Ví dụ: cnxh"
                    className="w-full px-4 py-2.5 bg-[#10131B] border border-[#252A37] rounded-full text-xs text-white placeholder-[#8B93A5] font-mono focus:outline-none focus:border-white/50 transition-colors"
                  />
                  <p className="text-[10px] text-[#8B93A5] font-mono">
                    Dùng trong định danh và lọc đề: <code>/dashboard?category={formSlug || "slug"}</code>
                  </p>
                </div>

                {/* Icon Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
                    Biểu tượng đại diện (Icon)
                  </label>
                  <PopoverSelect
                    className="w-full"
                    buttonClassName="w-full"
                    menuClassName="w-full"
                    value={formIcon}
                    onChange={(val) => setFormIcon(val)}
                    options={AVAILABLE_ICONS.map((opt) => {
                      const Icon = opt.icon;
                      return {
                        value: opt.value,
                        label: opt.label,
                        icon: <Icon className="h-4 w-4 text-white" />,
                      };
                    })}
                  />
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
                    Trạng thái hiển thị (Status)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormStatus("active")}
                      className={cn(
                        "py-2.5 px-3 rounded-full border text-xs font-semibold transition-all cursor-pointer",
                        formStatus === "active"
                          ? "bg-white text-black border-transparent shadow-sm"
                          : "bg-[#10131B] border-[#252A37] text-[#9CA3AF] hover:text-white"
                      )}
                    >
                      Kích hoạt (Active)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus("hidden")}
                      className={cn(
                        "py-2.5 px-3 rounded-full border text-xs font-semibold transition-all cursor-pointer",
                        formStatus === "hidden"
                          ? "bg-white text-black border-transparent shadow-sm"
                          : "bg-[#10131B] border-[#252A37] text-[#9CA3AF] hover:text-white"
                      )}
                    >
                      Ẩn (Hidden)
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-full text-xs text-[#9CA3AF] hover:text-white hover:bg-[#10131B] transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-white hover:bg-slate-200 text-[#05070D] font-bold text-xs rounded-full shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                    <span>{editingCategory ? "Lưu thay đổi" : "Tạo học phần"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
