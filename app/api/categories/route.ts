import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Fallback seed categories
const DEFAULT_CATEGORIES = [
  {
    id: "cat_cnxh",
    name: "Chủ nghĩa xã hội (CNXH)",
    slug: "cnxh",
    icon: "BookText",
    status: "active",
    created_at: new Date().toISOString(),
  },
];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    return createClient(url, key);
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });
      if (activeOnly) {
        query = query.eq("status", "active");
      }
      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ success: true, categories: data });
      }
    }

    const filtered = activeOnly
      ? DEFAULT_CATEGORIES.filter((c) => c.status === "active")
      : DEFAULT_CATEGORIES;

    return NextResponse.json({ success: true, categories: filtered });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, icon, status = "active" } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Tên danh mục và Slug không được để trống" },
        { status: 400 }
      );
    }

    const cleanSlug = String(slug)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    const newCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: String(name).trim(),
      slug: cleanSlug,
      icon: icon ? String(icon).trim() : "BookText",
      status: status === "hidden" ? "hidden" : "active",
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("categories")
        .insert(newCategory)
        .select()
        .single();
      if (!error && data) {
        return NextResponse.json({ success: true, category: data });
      }
    }

    return NextResponse.json({ success: true, category: newCategory });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
