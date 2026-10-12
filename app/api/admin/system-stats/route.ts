import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: "Supabase client is not configured.",
      }, { status: 500 });
    }

    // 1. Database Size measurement (RPC get_db_size() or row count calculation fallback)
    let dbBytes = 0;
    let rpcConfigured = false;

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_db_size");
      if (!rpcError && rpcData !== null && rpcData !== undefined) {
        dbBytes = Number(rpcData);
        rpcConfigured = true;
      }
    } catch {
      // RPC not registered yet
    }

    // Fetch exact counts across core tables
    const [examsRes, questionsRes, submissionsRes, profilesRes] = await Promise.all([
      supabase.from("exams").select("*", { count: "exact", head: true }).neq("title", "__SYSTEM_CATEGORIES__"),
      supabase.from("questions").select("*", { count: "exact", head: true }),
      supabase.from("submissions").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

    const examCount = examsRes.count || 0;
    const questionCount = questionsRes.count || 0;
    const subCount = submissionsRes.count || 0;
    const profileCount = profilesRes.count || 0;

    // If RPC is not created yet in Postgres, estimate real Postgres relation footprint
    if (!rpcConfigured) {
      // Postgres base system catalog (~8 MB) + 8KB pages per table/index
      const baseSystemBytes = 8 * 1024 * 1024;
      const questionsBytes = questionCount * 1800; // ~1.8KB avg per question record with JSON/options
      const examsBytes = examCount * 3000;
      const submissionsBytes = subCount * 2500;
      const profilesBytes = profileCount * 500;
      dbBytes = baseSystemBytes + questionsBytes + examsBytes + submissionsBytes + profilesBytes;
    }

    const dbMB = Number((dbBytes / (1024 * 1024)).toFixed(2));

    // 2. Supabase Storage measurement
    let storageBytes = 0;
    let fileCount = 0;
    let bucketsList: string[] = [];

    try {
      const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
      if (!bErr && Array.isArray(buckets)) {
        bucketsList = buckets.map((b) => b.name);
        for (const bucket of buckets) {
          try {
            const { data: files } = await supabase.storage.from(bucket.name).list();
            if (Array.isArray(files)) {
              for (const file of files) {
                if (file.name && !file.id) continue; // skip folder entries
                const size = (file.metadata as any)?.size || (file as any).size || 0;
                storageBytes += Number(size);
                fileCount++;
              }
            }
          } catch {
            // continue next bucket
          }
        }
      }
    } catch {
      // Storage buckets not initialized
    }

    const storageMB = Number((storageBytes / (1024 * 1024)).toFixed(2));

    return NextResponse.json({
      success: true,
      rpcConfigured,
      rpcSqlScript: `CREATE OR REPLACE FUNCTION get_db_size()\nRETURNS bigint AS $$\n SELECT pg_database_size(current_database());\n$$ LANGUAGE sql SECURITY DEFINER;`,
      database: {
        bytes: dbBytes,
        mb: dbMB,
        fromRpc: rpcConfigured,
      },
      storage: {
        bytes: storageBytes,
        mb: storageMB,
        bucketCount: bucketsList.length,
        fileCount,
        buckets: bucketsList,
      },
      stats: {
        exams: examCount,
        questions: questionCount,
        submissions: subCount,
        profiles: profileCount,
      },
      maxStorageMB: 500,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
