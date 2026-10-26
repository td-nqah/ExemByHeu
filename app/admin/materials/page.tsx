"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Library,
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileText,
  UploadCloud,
  Sparkles,
  Clipboard,
  BookOpen,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderTree,
  Tag,
  Table as TableIcon,
  FolderPlus,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCurrentUser,
  getCategories,
  createCategory,
  getStudyMaterials,
  saveStudyMaterial,
  deleteStudyMaterial,
} from "@/lib/store";
import { extractRawTextFromFile } from "@/lib/parsers";
import { Category, StudyMaterial } from "@/types/exam";
import { PopoverSelect } from "@/components/ui/PopoverSelect";
import { ComboboxInput } from "@/components/ui/ComboboxInput";

export default function AdminMaterialsPage() {
  const router = useRouter();

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  // Modal / Form state (Full Editor / AI)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [modalTab, setModalTab] = useState<"import" | "editor" | "preview">("import");

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formContentHtml, setFormContentHtml] = useState("");
  const [formReadingTime, setFormReadingTime] = useState(5);
  const [formAuthor, setFormAuthor] = useState("Ban Giảng huấn");

  // Quick Add Category in Modal state
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  // Quick Assign to Category Modal state
  const [isQuickAssignModalOpen, setIsQuickAssignModalOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategoryId, setQuickCategoryId] = useState("");
  const [quickSummary, setQuickSummary] = useState("");
  const quickReadingTime = 5;
  const [quickAuthor, setQuickAuthor] = useState("Ban Giảng huấn");
  const [isQuickSaving, setIsQuickSaving] = useState(false);

  // Import / AI states
  const [rawText, setRawText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/home");
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, mats] = await Promise.all([
        getCategories(false),
        getStudyMaterials(),
      ]);
      setCategories(cats);
      setMaterials(mats);
      if (cats.length > 0) {
        if (!formCategoryId) setFormCategoryId(cats[0].id);
        if (!quickCategoryId) setQuickCategoryId(cats[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setFormTitle("");
    setFormCategoryId(categories[0]?.id || "cat_cnxh");
    setFormSummary("");
    setFormContentHtml("");
    setFormReadingTime(5);
    setFormAuthor("Ban Giảng huấn");
    setRawText("");
    setUploadedFileName("");
    setAiMessage(null);
    setModalTab("import");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StudyMaterial) => {
    setEditingMaterial(item);
    setFormTitle(item.title);
    setFormCategoryId(item.category_id);
    setFormSummary(item.summary);
    setFormContentHtml(item.content_html);
    setFormReadingTime(item.reading_time || 5);
    setFormAuthor(item.author || "Ban Giảng huấn");
    setRawText("");
    setUploadedFileName(item.original_file_name || "");
    setAiMessage(null);
    setModalTab("editor");
    setIsModalOpen(true);
  };

  // Quick Add Category directly from Editor
  const handleQuickAddCategory = async () => {
    if (!newCatName.trim()) return;
    setIsCreatingCat(true);
    try {
      const cleanSlug = newCatName
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const created = await createCategory({
        name: newCatName.trim(),
        slug: cleanSlug || `cat-${Date.now()}`,
        icon: "BookOpen",
        status: "active",
      });
      const updatedCats = await getCategories(false);
      setCategories(updatedCats);
      setFormCategoryId(created.id);
      setNewCatName("");
      setShowQuickAddCat(false);
    } catch (err: any) {
      alert(err?.message || "Không thể tạo danh mục.");
    } finally {
      setIsCreatingCat(false);
    }
  };

  // Quick Assign to Category Handler
  const handleQuickAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setIsQuickSaving(true);
    try {
      const isNone = quickCategoryId === "none";
      const selectedCat = !isNone ? (categories.find((c) => c.id === quickCategoryId) || categories[0]) : null;
      const existing = materials.find(
        (m) => m.title.trim().toLowerCase() === quickTitle.trim().toLowerCase()
      );

      await saveStudyMaterial({
        id: existing?.id,
        title: quickTitle.trim(),
        category_id: isNone ? "none" : (selectedCat?.id || "cat_cnxh"),
        category_slug: isNone ? "none" : (selectedCat?.slug || "cnxh"),
        category_name: isNone ? "Không thuộc môn nào" : (selectedCat?.name || "Chuyên đề"),
        summary:
          quickSummary.trim() ||
          existing?.summary ||
          "Tổng hợp kiến thức trọng tâm và tóm tắt lý thuyết theo đề cương môn học.",
        content_html:
          existing?.content_html ||
          `<h2>1. Tổng quan kiến thức: ${quickTitle.trim()}</h2>\n<p>Tài liệu đang được cập nhật chi tiết nội dung...</p>\n<div class="callout-box border-l-4 border-[#5852d6] bg-indigo-950/30 p-4 rounded-r-xl my-4 text-indigo-100 text-sm">\n  <p class="font-bold uppercase tracking-wider text-xs mb-1">Ghi chú cốt lõi</p>\n  <p class="leading-relaxed">Xem kỹ các định nghĩa trọng tâm và bài tập ôn thi kèm theo.</p>\n</div>`,
        reading_time: Number(quickReadingTime) || 5,
        author: quickAuthor.trim() || "Ban Giảng huấn",
        original_file_name: existing?.original_file_name,
      });

      setIsQuickAssignModalOpen(false);
      setQuickTitle("");
      setQuickSummary("");
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Lỗi khi lưu tài liệu");
    } finally {
      setIsQuickSaving(false);
    }
  };

  // Handle File Upload & Text extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingFile(true);
    setUploadedFileName(file.name);
    setAiMessage(null);

    try {
      const extracted = await extractRawTextFromFile(file);
      if (!extracted || !extracted.trim()) {
        throw new Error("Không tìm thấy nội dung văn bản trong tệp đã chọn.");
      }
      setRawText(extracted);
      if (!formTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setFormTitle(cleanName);
      }
      setAiMessage({
        type: "success",
        text: `Đã trích xuất thành công ${extracted.length} ký tự từ file "${file.name}". Nhấn nút "Chuyển thành Tạp chí bằng AI" để tự động định dạng.`,
      });
    } catch (err: any) {
      setAiMessage({
        type: "error",
        text: err?.message || "Lỗi khi trích xuất tệp.",
      });
    } finally {
      setIsExtractingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Call AI / Parser
  const handleParseWithAi = async () => {
    const textToParse = rawText.trim() || formContentHtml.replace(/<[^>]+>/g, " ").trim();
    if (!textToParse) {
      setAiMessage({
        type: "error",
        text: "Vui lòng nhập hoặc tải lên nội dung văn bản trước khi xử lý.",
      });
      return;
    }

    setIsAiProcessing(true);
    setAiMessage(null);

    try {
      const res = await fetch("/api/ai/parse-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: textToParse,
          titleHint: formTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Không thể phân tích tài liệu.");
      }

      setFormTitle(data.title || formTitle);
      setFormSummary(data.summary || formSummary);
      setFormContentHtml(data.content_html || "");
      setFormReadingTime(Number(data.reading_time) || 5);

      setAiMessage({
        type: "success",
        text: `Đã dựng cấu trúc tạp chí thành công (${data.mode === "ai" ? "Gemini AI Model: " + data.model : "Bộ dựng tự động"}). Bạn có thể chuyển sang tab "Xem Trước" hoặc "Biên Tập" để tinh chỉnh.`,
      });

      // Switch to editor
      setModalTab("editor");
    } catch (err: any) {
      setAiMessage({
        type: "error",
        text: err?.message || "Lỗi xử lý AI.",
      });
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Quick insert helpers in Rich Text Editor
  const insertSnippet = (snippet: string) => {
    setFormContentHtml((prev) => prev + "\n" + snippet);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Vui lòng nhập tiêu đề bài viết.");
      return;
    }
    if (!formContentHtml.trim()) {
      alert("Nội dung bài viết không được để trống.");
      return;
    }

    setIsSaving(true);
    try {
      const isNone = formCategoryId === "none";
      const cat = !isNone ? categories.find((c) => c.id === formCategoryId) : null;
      await saveStudyMaterial({
        id: editingMaterial?.id,
        title: formTitle.trim(),
        category_id: isNone ? "none" : formCategoryId,
        category_slug: isNone ? "none" : cat?.slug,
        category_name: isNone ? "Tài liệu chung (Không gắn học phần)" : (cat?.name || "Chuyên đề"),
        summary: formSummary.trim(),
        content_html: formContentHtml.trim(),
        reading_time: Number(formReadingTime) || 5,
        author: formAuthor.trim() || "Ban Giảng huấn",
        original_file_name: uploadedFileName || editingMaterial?.original_file_name,
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Lỗi khi lưu tài liệu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteStudyMaterial(id);
    setDeleteConfirmId(null);
    await loadData();
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    let matchCat = true;
    if (selectedCategory === "none") {
      matchCat = m.category_id === "none" || m.category_slug === "none" || !m.category_id;
    } else if (selectedCategory !== "all") {
      matchCat = m.category_id === selectedCategory || m.category_slug === selectedCategory;
    }
    const matchSearch =
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-fluid-h p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2937]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4f46e5]/10 border border-[#4f46e5]/30 text-indigo-400 shadow-[0_0_12px_rgba(79,70,229,0.15)]">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Quản lý Học liệu & Đề cương
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#4f46e5]/15 text-indigo-300 border border-[#4f46e5]/30 font-medium">
                  Học liệu học thuật
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#9ca3af] mt-0.5">
                Biên soạn, xuất bản và phân loại học liệu học thuật, đề cương học phần trực tuyến.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setQuickTitle("");
              setQuickSummary("");
              if (categories.length > 0 && !quickCategoryId) {
                setQuickCategoryId(categories[0].id);
              }
              setIsQuickAssignModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0b0f19] hover:bg-[#111827] border border-[#1f2937] text-slate-200 hover:text-white font-medium px-3.5 py-2 text-xs transition-colors cursor-pointer"
          >
            <FolderPlus className="h-4 w-4 text-[#6366f1] shrink-0" />
            <span>Phân loại học phần</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] hover:bg-[#6366f1] px-4 py-2 text-xs font-bold text-white transition shadow-lg shadow-[#4f46e5]/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm học liệu mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề hoặc nội dung tóm tắt..."
              className="w-full rounded-xl border border-[#1f2937] bg-[#111827] px-4 py-2.5 text-xs text-white placeholder-[#9ca3af] focus:border-[#4f46e5] focus:outline-none transition-colors"
            />
          </div>

          {/* Interactive Category Selector with Secondary Content Bars */}
          <div className="md:col-span-4 relative">
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                selectedCategory !== "all"
                  ? "bg-[#4f46e5]/15 border-[#4f46e5]/50 text-indigo-200 shadow-sm"
                  : "bg-[#111827] border-[#1f2937] text-slate-200 hover:border-[#374151] hover:text-white"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <FolderTree className="h-4 w-4 text-[#6366f1] shrink-0" />
                <span className="text-[#9ca3af] font-normal">Học phần:</span>
                <span className="font-bold text-white truncate">
                  {selectedCategory === "all"
                    ? "Tất cả học phần"
                    : selectedCategory === "none"
                    ? "Tài liệu chung (Không gắn học phần)"
                    : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || "Chuyên đề"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-slate-300">
                  {selectedCategory === "all"
                    ? materials.length
                    : selectedCategory === "none"
                    ? materials.filter((m) => m.category_id === "none" || m.category_slug === "none" || !m.category_id).length
                    : materials.filter((m) => m.category_id === selectedCategory || m.category_slug === selectedCategory).length}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-[#9ca3af] transition-transform duration-200", isCategoryMenuOpen && "rotate-180")} />
              </div>
            </button>

            {/* Secondary Content Bars Popover */}
            <AnimatePresence>
              {isCategoryMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsCategoryMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-[#1f2937] bg-[#0b0f19]/95 backdrop-blur-xl p-2 shadow-2xl space-y-1.5 min-w-[280px]"
                  >
                    <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider flex items-center justify-between border-b border-[#1f2937]/80 pb-2">
                      <span>Chọn danh mục học phần</span>
                      <span>{categories.length + 2} phân loại</span>
                    </div>

                    {/* Thanh nội dung phụ: Tất cả môn học */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("all");
                        setIsCategoryMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer group",
                        selectedCategory === "all"
                          ? "bg-[#4f46e5]/20 border-[#4f46e5]/50 text-white shadow-sm"
                          : "border-transparent bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#1f2937] text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[#4f46e5]/15 border border-[#4f46e5]/30 flex items-center justify-center text-[#6366f1] shrink-0">
                          <Library className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                            Tất cả học phần
                          </p>
                          <p className="text-[10px] text-[#9ca3af]">Toàn bộ học liệu trong chương trình đào tạo</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-white/5 border border-white/10 text-slate-300 font-bold">
                          {materials.length} bài
                        </span>
                        {selectedCategory === "all" && (
                          <CheckCircle2 className="h-4 w-4 text-[#6366f1]" />
                        )}
                      </div>
                    </button>

                    {/* Thanh nội dung phụ: Không thuộc môn nào */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("none");
                        setIsCategoryMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer group",
                        selectedCategory === "none"
                          ? "bg-[#4f46e5]/20 border-[#4f46e5]/50 text-white shadow-sm"
                          : "border-transparent bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#1f2937] text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-slate-200 transition truncate">
                            Tài liệu chung (Không gắn học phần)
                          </p>
                          <p className="text-[10px] text-[#9ca3af] truncate">Tài liệu tham khảo chung</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                          {materials.filter((m) => m.category_id === "none" || m.category_slug === "none" || !m.category_id).length} bài
                        </span>
                        {selectedCategory === "none" && (
                          <CheckCircle2 className="h-4 w-4 text-[#6366f1]" />
                        )}
                      </div>
                    </button>

                    {/* Các thanh nội dung phụ cho từng Chuyên mục */}
                    <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                      {categories.map((c) => {
                        const count = materials.filter(
                          (m) => m.category_id === c.id || m.category_slug === c.slug
                        ).length;
                        const isSelected = selectedCategory === c.id || selectedCategory === c.slug;

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(c.id);
                              setIsCategoryMenuOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer group",
                              isSelected
                                ? "bg-[#4f46e5]/20 border-[#4f46e5]/50 text-white shadow-sm"
                                : "border-transparent bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#1f2937] text-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-[#064e3b]/50 border border-[#064e3b] flex items-center justify-center text-[#34d399] shrink-0">
                                <Tag className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition truncate">
                                  {c.name}
                                </p>
                                <p className="text-[10px] text-[#9ca3af] font-mono truncate">
                                  Mã: {c.slug}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#064e3b]/40 border border-[#064e3b] text-[#34d399] font-bold">
                                {count} bài
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-[#34d399]" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="md:col-span-3 text-right text-xs text-[#9ca3af]">
            Hiển thị <span className="font-bold text-white">{filteredMaterials.length}</span> bài viết
          </div>
        </div>

        {/* Active category filter pill */}
        {selectedCategory !== "all" && (
          <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
            <span>Đang lọc theo:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#4f46e5]/20 text-indigo-300 border border-[#4f46e5]/40 text-xs font-bold">
              <Tag className="h-3 w-3" />
              {selectedCategory === "none"
                ? "Tài liệu chung (Không gắn học phần)"
                : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || "Chuyên đề"}
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="hover:text-white ml-1 p-0.5 cursor-pointer rounded hover:bg-white/10 transition"
                title="Bỏ lọc, xem tất cả"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#9ca3af] text-xs">
          <RefreshCw className="h-5 w-5 animate-spin mr-2 text-indigo-400" />
          Đang tải danh sách tài liệu...
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1f2937] bg-[#111827]/50 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#6b7280] mb-3" />
          <h3 className="text-sm font-semibold text-white">Chưa có học liệu nào</h3>
          <p className="text-xs text-[#9ca3af] mt-1 max-w-md mx-auto">
            Nhấn "Phân loại học phần" để gán nhanh tài liệu, hoặc "Thêm học liệu mới" để tải lên tệp giáo trình.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setQuickTitle("");
                setIsQuickAssignModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0b0f19] hover:bg-[#111827] border border-[#1f2937] px-4 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer"
            >
              <FolderPlus className="h-4 w-4 text-[#6366f1]" />
              Phân loại học phần
            </button>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-4 py-2 text-xs font-bold text-white hover:bg-[#6366f1] transition cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Plus className="h-4 w-4" />
              Biên tập học liệu mới
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMaterials.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl obsidian-card-interactive p-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {item.category_id === "none" || item.category_slug === "none" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      <FileText className="h-3 w-3 text-slate-400" />
                      {item.category_name || "Tài liệu chung (Không gắn học phần)"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#064e3b]/70 text-[#34d399] border border-[#064e3b]">
                      <Tag className="h-3 w-3 text-[#34d399]" />
                      {item.category_name || "Chuyên đề"}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-heading text-base font-bold text-white group-hover:text-indigo-300 transition line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#9ca3af] mt-1.5 line-clamp-3 leading-relaxed">
                    {item.summary || "Tổng hợp kiến thức trọng tâm..."}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#1f2937] flex items-center justify-between">
                <div className="text-[11px] text-[#9ca3af]">
                  Tác giả: <span className="text-slate-300">{item.author || "Ban Giảng huấn"}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/knowledge/${item.id}`}
                    target="_blank"
                    className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#6366f1] hover:bg-white/5 transition"
                    title="Xem thử giao diện Người đọc"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-[#9ca3af] hover:text-amber-300 hover:bg-white/5 transition cursor-pointer"
                    title="Chỉnh sửa chi tiết nội dung"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-1.5 rounded-lg text-[#9ca3af] hover:text-rose-400 hover:bg-white/5 transition cursor-pointer"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Quick Assign to Category (Tương tự bên Ngân hàng Đề thi) */}
      <AnimatePresence>
        {isQuickAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-slate-950/95 border border-indigo-500/25 p-6 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderPlus className="h-5 w-5 text-[#6366f1] shrink-0" />
                  <span>Phân loại Học liệu theo Học phần</span>
                </h3>
                <button
                  onClick={() => setIsQuickAssignModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleQuickAssignSubmit} className="space-y-4 mt-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      Tiêu đề học liệu / Đề cương (*)
                    </label>
                    <span className="text-[11px] text-[#9ca3af]">
                      Gõ tên mới hoặc chọn tài liệu có sẵn
                    </span>
                  </div>
                  <ComboboxInput
                    required
                    value={quickTitle}
                    onChange={setQuickTitle}
                    placeholder="VD: Đề cương chi tiết: Chương 2 Hệ quản trị CSDL"
                    suggestions={materials.map((m) => ({
                      id: m.id,
                      title: m.title,
                      subtitle: m.category_name || "Học liệu",
                    }))}
                  />
                </div>

                {/* Category Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Chọn Học phần đào tạo (*)
                  </label>
                  <PopoverSelect
                    className="w-full"
                    buttonClassName="w-full"
                    menuClassName="w-full"
                    value={quickCategoryId}
                    onChange={(val) => setQuickCategoryId(val)}
                    options={[
                      {
                        value: "none",
                        label: "Tài liệu chung (Không gắn học phần)",
                        description: "Học liệu chung không gắn với học phần cụ thể",
                      },
                      ...categories.map((c) => ({
                        value: c.id,
                        label: c.name,
                        description: `Mã: ${c.slug}`,
                      })),
                    ]}
                  />
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Tóm tắt cốt lõi (Summary)
                  </label>
                  <textarea
                    rows={3}
                    value={quickSummary}
                    onChange={(e) => setQuickSummary(e.target.value)}
                    placeholder="Mô tả ngắn gọn nội dung kiến thức của tài liệu này..."
                    className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#1f2937] rounded-xl text-xs text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#4f46e5]"
                  />
                </div>

                {/* Author */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Tác giả / Nguồn biên soạn
                  </label>
                  <input
                    type="text"
                    value={quickAuthor}
                    onChange={(e) => setQuickAuthor(e.target.value)}
                    placeholder="VD: Ban Giảng huấn, ThS. Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 bg-[#111827] border border-[#1f2937] rounded-xl text-xs text-white focus:outline-none focus:border-[#4f46e5]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2937]">
                  <button
                    type="button"
                    onClick={() => setIsQuickAssignModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#1f2937] text-xs font-semibold text-slate-300 hover:bg-white/5 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isQuickSaving}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#6366f1] text-white text-xs font-bold transition shadow-lg shadow-[#4f46e5]/20 cursor-pointer disabled:opacity-50"
                  >
                    {isQuickSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Lưu phân loại
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-slate-950/95 p-5 shadow-2xl shadow-rose-950/50 backdrop-blur-xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Xác nhận xóa học liệu</h4>
                  <p className="text-xs text-slate-400">Hành động này không thể hoàn tác.</p>
                </div>
              </div>
              <p className="text-xs text-slate-300">
                Bạn có chắc chắn muốn xóa học liệu này khỏi hệ thống?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white transition cursor-pointer"
                >
                  Xóa vĩnh viễn
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Full Editor & AI Parser Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-indigo-500/25 bg-slate-950/95 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/15 bg-slate-900/70 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-white">
                      {editingMaterial ? "Chỉnh sửa Học liệu & Đề cương" : "Thêm mới & Xuất bản Học liệu"}
                    </h3>
                    <p className="text-[11px] text-[#9ca3af]">
                      Tự động trích xuất nội dung văn bản thành định dạng học liệu trực quan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Tabs */}
                  <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-indigo-500/20 mr-3">
                    <button
                      type="button"
                      onClick={() => setModalTab("import")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5",
                        modalTab === "import"
                          ? "bg-[#4f46e5]/20 text-indigo-300 font-bold border border-[#4f46e5]/40"
                          : "text-[#9ca3af] hover:text-white"
                      )}
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      Nhập liệu & AI
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab("editor")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5",
                        modalTab === "editor"
                          ? "bg-[#4f46e5]/20 text-indigo-300 font-bold border border-[#4f46e5]/40"
                          : "text-[#9ca3af] hover:text-white"
                      )}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Biên tập nội dung
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab("preview")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5",
                        modalTab === "preview"
                          ? "bg-[#4f46e5]/20 text-indigo-300 font-bold border border-[#4f46e5]/40"
                          : "text-[#9ca3af] hover:text-white"
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Xem trước
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Status / AI feedback */}
              {aiMessage && (
                <div
                  className={cn(
                    "px-6 py-2.5 text-xs flex items-center gap-2 border-b",
                    aiMessage.type === "success"
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                      : "bg-rose-950/40 border-rose-500/30 text-rose-200"
                  )}
                >
                  {aiMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  )}
                  <span className="flex-1">{aiMessage.text}</span>
                  <button
                    type="button"
                    onClick={() => setAiMessage(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {/* TAB 1: IMPORT & AI PARSER */}
                {modalTab === "import" && (
                  <div className="space-y-6">
                    {/* Upload File Zone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-dashed border-[#1f2937] bg-[#111827]/60 p-6 flex flex-col items-center justify-center text-center hover:border-[#4f46e5]/50 transition">
                        <UploadCloud className="h-10 w-10 text-indigo-400 mb-2" />
                        <h4 className="text-xs sm:text-sm font-bold text-white">Tải lên tệp tài liệu</h4>
                        <p className="text-[11px] text-[#9ca3af] mt-1 max-w-xs">
                          Hỗ trợ tệp Word (<code>.docx</code>), Excel (<code>.xlsx</code>), PDF (<code>.pdf</code>) hoặc Text (<code>.txt</code>, <code>.md</code>)
                        </p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept=".docx,.doc,.xlsx,.xls,.pdf,.txt,.md"
                          className="hidden"
                          id="material-file-upload"
                        />
                        <label
                          htmlFor="material-file-upload"
                          className={cn(
                            "mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer",
                            isExtractingFile
                              ? "bg-slate-700 text-slate-400 pointer-events-none"
                              : "bg-[#4f46e5] hover:bg-[#6366f1] text-white"
                          )}
                        >
                          {isExtractingFile ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Đang đọc file...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-4 w-4" />
                              Chọn tệp từ máy
                            </>
                          )}
                        </label>
                        {uploadedFileName && (
                          <span className="text-[11px] text-indigo-300 mt-2 font-mono">
                            Đã chọn: {uploadedFileName}
                          </span>
                        )}
                      </div>

                      {/* AI Parser Trigger */}
                      <div className="rounded-2xl border border-[#4f46e5]/30 bg-gradient-to-br from-[#4f46e5]/10 to-indigo-950/30 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-indigo-400 mb-1.5">
                            <Sparkles className="h-5 w-5" />
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              Trợ lý AI Biên tập Học liệu
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            AI tự động chia các đề mục <code>&lt;h2&gt;</code>, <code>&lt;h3&gt;</code> để sinh Mục lục động (TOC), lồng ghép các khung ghi chú Neon Callout và chuyển bảng so sánh dữ liệu thành bảng chuẩn trực quan.
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#1f2937] flex items-center justify-between">
                          <span className="text-[11px] text-[#9ca3af]">
                            {rawText ? `Đã nạp ${rawText.length} ký tự` : "Chưa có nội dung"}
                          </span>
                          <button
                            type="button"
                            onClick={handleParseWithAi}
                            disabled={isAiProcessing || (!rawText.trim() && !formContentHtml.trim())}
                            className={cn(
                              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg",
                              isAiProcessing || (!rawText.trim() && !formContentHtml.trim())
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-[#4f46e5] to-indigo-600 text-white hover:brightness-110"
                            )}
                          >
                            {isAiProcessing ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                AI đang biên tập...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                Chuyển thành Tạp chí bằng AI
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Raw Text Clipboard Paste Area */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <Clipboard className="h-3.5 w-3.5 text-indigo-400" />
                          Hoặc dán văn bản trực tiếp từ Clipboard / Giáo trình:
                        </label>
                        {rawText && (
                          <button
                            type="button"
                            onClick={() => setRawText("")}
                            className="text-[11px] text-[#9ca3af] hover:text-rose-400 cursor-pointer"
                          >
                            Xóa trắng
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={10}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Dán nội dung bài học, đề cương, câu hỏi ôn tập hoặc tóm tắt kiến thức vào đây..."
                        className="w-full rounded-xl border border-[#1f2937] bg-[#111827] p-3.5 text-xs text-white placeholder-[#9ca3af] focus:border-[#4f46e5] focus:outline-none font-mono custom-scrollbar leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: RICH EDITOR */}
                {modalTab === "editor" && (
                  <div className="space-y-4">
                    {/* Meta info row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-7 space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Tiêu đề bài viết (*)</label>
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="VD: Tổng quan Hệ điều hành & Quản lý Tiến trình"
                          className="w-full rounded-xl border border-[#1f2937] bg-[#111827] px-3.5 py-2 text-xs text-white focus:border-[#4f46e5] focus:outline-none font-bold"
                        />
                      </div>

                      <div className="md:col-span-5 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-300">
                            Học phần đào tạo (*)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            <span>{showQuickAddCat ? "Đóng" : "Tạo học phần mới"}</span>
                          </button>
                        </div>

                        {showQuickAddCat && (
                          <div className="p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-950/30 space-y-2 mb-2 animate-in fade-in duration-150">
                            <p className="text-[10px] text-indigo-300 font-medium">
                              Thêm học phần đào tạo mới:
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                placeholder="VD: Ghi chú ôn thi, Kỹ năng mềm..."
                                className="flex-1 rounded-lg border border-[#1f2937] bg-[#111827] px-2.5 py-1 text-xs text-white focus:border-[#4f46e5] focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleQuickAddCategory();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleQuickAddCategory}
                                disabled={isCreatingCat || !newCatName.trim()}
                                className="px-2.5 py-1 rounded-lg bg-[#4f46e5] hover:bg-[#6366f1] text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer"
                              >
                                {isCreatingCat ? "..." : "Thêm"}
                              </button>
                            </div>
                          </div>
                        )}

                        <PopoverSelect
                          className="w-full"
                          buttonClassName="w-full py-2"
                          menuClassName="w-full"
                          value={formCategoryId}
                          onChange={(val) => setFormCategoryId(val)}
                          options={[
                            {
                              value: "none",
                              label: "Tài liệu chung (Không gắn học phần)",
                              description: "Học liệu chung không gắn với học phần cụ thể",
                            },
                            ...categories.map((c) => ({
                              value: c.id,
                              label: c.name,
                              description: `Mã: ${c.slug}`,
                            })),
                          ]}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-8 space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Tóm tắt mở đầu (Summary)</label>
                        <input
                          type="text"
                          value={formSummary}
                          onChange={(e) => setFormSummary(e.target.value)}
                          placeholder="1-2 câu cô đọng giá trị cốt lõi của bài đọc..."
                          className="w-full rounded-xl border border-[#1f2937] bg-[#111827] px-3.5 py-2 text-xs text-white focus:border-[#4f46e5] focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-4 space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Tác giả / Nguồn</label>
                        <input
                          type="text"
                          value={formAuthor}
                          onChange={(e) => setFormAuthor(e.target.value)}
                          placeholder="VD: Ban Giảng huấn, ThS. Nguyễn Văn A"
                          className="w-full rounded-xl border border-[#1f2937] bg-[#111827] px-3.5 py-2 text-xs text-white focus:border-[#4f46e5] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Quick Format Toolbar */}
                    <div className="p-2.5 rounded-xl border border-[#1f2937] bg-[#111827] flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-[#9ca3af] mr-1">Chèn nhanh:</span>
                      <button
                        type="button"
                        onClick={() => insertSnippet(`<h2>Tiêu đề Mục lớn Mới</h2>\n<p class="leading-relaxed text-slate-300 mb-4">Nội dung chi tiết...</p>`)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#1f2937] hover:bg-[#374151] text-indigo-300 transition cursor-pointer"
                      >
                        + Mục lớn (H2)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet(`<h3>Tiểu mục chi tiết</h3>\n<p class="leading-relaxed text-slate-300 mb-4">Giải thích...</p>`)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#1f2937] hover:bg-[#374151] text-slate-200 transition cursor-pointer"
                      >
                        + Tiểu mục (H3)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertSnippet(`<div class="callout-box border-l-4 border-[#4f46e5] bg-indigo-950/30 p-4 rounded-r-xl my-4 text-indigo-100 text-sm">\n  <p class="font-bold uppercase tracking-wider text-xs mb-1">Cốt Lõi Cần Nhớ</p>\n  <p class="leading-relaxed">Nội dung ghi chú cốt lõi...</p>\n</div>`)
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#4f46e5]/20 hover:bg-[#4f46e5]/30 text-indigo-300 border border-[#4f46e5]/30 transition cursor-pointer"
                      >
                        + Callout Cốt Lõi (Tím)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertSnippet(`<div class="callout-box border-l-4 border-emerald-500 bg-emerald-950/30 p-4 rounded-r-xl my-4 text-emerald-100 text-sm">\n  <p class="font-bold uppercase tracking-wider text-xs mb-1">Mẹo Ôn Thi</p>\n  <p class="leading-relaxed">Mẹo nhớ công thức hoặc cách giải bài tập...</p>\n</div>`)
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
                      >
                        + Callout Mẹo Thi (Xanh lá)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertSnippet(`<div class="callout-box border-l-4 border-amber-500 bg-amber-950/30 p-4 rounded-r-xl my-4 text-amber-100 text-sm">\n  <p class="font-bold uppercase tracking-wider text-xs mb-1">Cảnh Báo Hay Nhầm Lẫn</p>\n  <p class="leading-relaxed">Chú ý bẫy thường gặp trong đề thi trắc nghiệm...</p>\n</div>`)
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition cursor-pointer"
                      >
                        + Callout Cảnh Báo (Vàng)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertSnippet(`<div class="overflow-x-auto my-6 rounded-xl border border-[#1f2937] bg-[#0b0f19]/70">\n  <table class="w-full text-left text-xs sm:text-sm">\n    <thead>\n      <tr class="bg-indigo-950/60 text-indigo-200 border-b border-[#1f2937]">\n        <th class="p-3">Tiêu chí</th>\n        <th class="p-3">Đối tượng A</th>\n        <th class="p-3">Đối tượng B</th>\n      </tr>\n    </thead>\n    <tbody class="divide-y divide-white/5 text-slate-300">\n      <tr class="hover:bg-white/[0.02]">\n        <td class="p-3 font-mono font-medium text-slate-200">Đặc tính 1</td>\n        <td class="p-3">Giá trị A</td>\n        <td class="p-3 text-indigo-300">Giá trị B</td>\n      </tr>\n    </tbody>\n  </table>\n</div>`)
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#1f2937] hover:bg-[#374151] text-indigo-300 transition cursor-pointer flex items-center gap-1"
                      >
                        <TableIcon className="h-3 w-3" />
                        + Bảng So Sánh
                      </button>
                    </div>

                    {/* HTML Content Editor */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300">
                          Nội dung HTML Bài viết (*):
                        </label>
                        <span className="text-[11px] text-[#9ca3af]">
                          Dùng thẻ &lt;h2&gt; để tự động tạo Mục lục (TOC)
                        </span>
                      </div>
                      <textarea
                        rows={14}
                        value={formContentHtml}
                        onChange={(e) => setFormContentHtml(e.target.value)}
                        placeholder="Nội dung mã HTML của bài viết..."
                        className="w-full rounded-xl border border-[#1f2937] bg-[#111827] p-3.5 text-xs text-white placeholder-[#9ca3af] focus:border-[#4f46e5] focus:outline-none font-mono custom-scrollbar leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: LIVE MAGAZINE PREVIEW */}
                {modalTab === "preview" && (
                  <div className="space-y-6">
                    <div className="p-6 sm:p-8 rounded-2xl border border-[#1f2937] bg-[#111827] max-w-4xl mx-auto shadow-xl">
                      {/* Header Preview */}
                      <div className="space-y-3 pb-6 border-b border-[#1f2937]">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#4f46e5]/15 text-indigo-300 border border-[#4f46e5]/25">
                            {categories.find((c) => c.id === formCategoryId)?.name || "Chuyên đề"}
                          </span>
                        </div>
                        <h1 className="text-xl sm:text-3xl font-heading font-extrabold text-white leading-tight">
                          {formTitle || "Tiêu đề bài viết"}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 italic border-l-2 border-[#4f46e5] pl-3">
                          {formSummary || "Tóm tắt bài viết..."}
                        </p>
                        <div className="text-xs text-[#9ca3af] pt-2">
                          Biên soạn bởi: <span className="text-white font-medium">{formAuthor || "Ban Giảng huấn"}</span>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div
                        className="prose prose-invert max-w-none pt-6 text-slate-300 text-xs sm:text-sm leading-relaxed magazine-article-content"
                        dangerouslySetInnerHTML={{
                          __html: formContentHtml || "<p class='text-slate-500 italic'>Chưa có nội dung. Chuyển sang tab Biên tập hoặc Nhập liệu để thêm nội dung.</p>",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-indigo-500/15 bg-slate-900/70 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="text-xs text-[#9ca3af]">
                  {modalTab === "import" && "Mẹo: Bạn có thể nhấn 'Chuyển thành Tạp chí bằng AI' để tự động định dạng."}
                  {modalTab === "editor" && "Chuyển sang tab 'Xem trước' để kiểm tra giao diện trước khi lưu."}
                  {modalTab === "preview" && "Giao diện bài đọc sẽ hiển thị y hệt với người dùng khi xuất bản."}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700/60 bg-slate-800/60 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Đang xuất bản...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Lưu & Xuất Bản
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
