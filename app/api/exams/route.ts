import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const examId = searchParams.get("id");
    const categorySlug = searchParams.get("category");
    const categoryId = searchParams.get("categoryId");

    const supabase = getSupabaseClient();
    if (supabase) {
      // Lightweight fetch: questions(id, type) for counts & type, or questions(*) for single exam
      const selectFields = examId ? "*, questions(*)" : "*, questions(id, type)";
      let query = supabase.from("exams").select(selectFields);
      if (examId) {
        query = query.eq("id", examId);
      }
      if (categorySlug) {
        query = query.eq("category_slug", categorySlug);
      }
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
      const { data, error } = await query.order("created_at", { ascending: true });
      if (!error && data) {
        const sortedExams = [...data].sort((a: any, b: any) => {
          const baseA = a.title.includes(":") ? a.title.split(":")[0].trim() : "";
          const baseB = b.title.includes(":") ? b.title.split(":")[0].trim() : "";
          if (baseA && baseB && baseA !== baseB) {
            return a.title.localeCompare(b.title, "vi", { numeric: true });
          }
          const numA = parseInt(a.title.match(/Đề\s*(\d+)/i)?.[1] || a.title.match(/\d+/)?.[0] || "0", 10);
          const numB = parseInt(b.title.match(/Đề\s*(\d+)/i)?.[1] || b.title.match(/\d+/)?.[0] || "0", 10);
          if (numA !== numB) return numA - numB;
          return a.title.localeCompare(b.title, "vi", { numeric: true });
        });
        return NextResponse.json({ success: true, exams: sortedExams });
      }
    }

    return NextResponse.json({ success: true, exams: [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description = "",
      duration_minutes = 60,
      category_id,
      category_slug,
      question_count = 0,
      question_type = "multiple_choice",
      expires_at = null,
      status = "published",
      is_shuffled = false,
      created_by = "00000000-0000-0000-0000-000000000001",
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề đề thi không được để trống" },
        { status: 400 }
      );
    }

    const newExam = {
      id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: String(title).trim(),
      description: String(description).trim(),
      duration_minutes: Number(duration_minutes) || 60,
      category_id: category_id || null,
      category_slug: category_slug || null,
      question_count: Number(question_count) || 0,
      question_type: question_type || "multiple_choice",
      expires_at: expires_at || null,
      created_by,
      status: status === "draft" ? "draft" : "published",
      is_shuffled: Boolean(is_shuffled),
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("exams")
        .insert(newExam)
        .select()
        .single();
      if (!error && data) {
        return NextResponse.json({ success: true, exam: data });
      }
    }

    return NextResponse.json({ success: true, exam: newExam });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
