import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { AccountSecurity, Profile } from "@/types/exam";

const DEFAULT_SECURITY_MAP: Record<string, AccountSecurity> = {
  admin: {
    username: "admin",
    role: "admin",
    is_active: true,
    ips: [],
    devices: [],
    updated_at: new Date().toISOString(),
  },
  tth: {
    username: "tth",
    role: "user",
    is_active: true,
    ips: [],
    devices: [],
    updated_at: new Date().toISOString(),
  },
  tmh: {
    username: "tmh",
    role: "user",
    is_active: true,
    ips: [],
    devices: [],
    updated_at: new Date().toISOString(),
  },
  user: {
    username: "user",
    role: "user",
    is_active: true,
    ips: [],
    devices: [],
    updated_at: new Date().toISOString(),
  },
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// Helper to fetch security map from Supabase
async function getSecurityMap(sb: any): Promise<Record<string, AccountSecurity>> {
  if (!sb) return { ...DEFAULT_SECURITY_MAP };
  try {
    const { data } = await sb
      .from("exams")
      .select("id, description")
      .eq("title", "__SYSTEM_ACCOUNT_SECURITY__")
      .maybeSingle();

    if (data && data.description) {
      const parsed = JSON.parse(data.description);
      const merged = { ...DEFAULT_SECURITY_MAP, ...parsed };
      // Purge adm permanently
      if (merged.adm) delete merged.adm;
      if (merged.admin) {
        merged.admin.role = "admin";
        merged.admin.is_active = true;
      }
      return merged;
    }
  } catch (err) {
    console.error("Failed to fetch security map:", err);
  }
  return { ...DEFAULT_SECURITY_MAP };
}

// Helper to save security map to Supabase
async function saveSecurityMap(sb: any, map: Record<string, AccountSecurity>) {
  if (!sb) return;
  try {
    const { data: existing } = await sb
      .from("exams")
      .select("id")
      .eq("title", "__SYSTEM_ACCOUNT_SECURITY__")
      .maybeSingle();

    const desc = JSON.stringify(map);
    if (existing) {
      await sb
        .from("exams")
        .update({ description: desc })
        .eq("id", existing.id);
    } else {
      await sb.from("exams").insert({
        title: "__SYSTEM_ACCOUNT_SECURITY__",
        description: desc,
        duration_minutes: 0,
        status: "draft",
        created_by: "00000000-0000-0000-0000-000000000001",
      });
    }
  } catch (err) {
    console.error("Failed to save security map:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, deviceId } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." },
        { status: 400 }
      );
    }

    const inputUser = String(username).trim().toLowerCase().replace(/!+$/, "");
    if (inputUser === "adm") {
      return NextResponse.json(
        { error: "Tài khoản 'adm' đã bị xóa vĩnh viễn khỏi hệ thống." },
        { status: 401 }
      );
    }
    const targetAccount = inputUser;

    // Determine client IP address
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp =
      (forwarded ? forwarded.split(",")[0].trim() : null) ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const currentDevice = String(deviceId || "device_browser").trim();

    const sb = getSupabaseAdmin();
    const secMap = await getSecurityMap(sb);

    let isKnownAccount =
      ["admin", "tth", "tmh", "user"].includes(targetAccount) ||
      Boolean(secMap[targetAccount]);

    let profile: Profile | null = null;
    let isMatch = false;

    // Check credentials against Supabase profiles table
    if (sb) {
      try {
        const { data } = await sb
          .from("profiles")
          .select("*")
          .ilike("username", targetAccount)
          .maybeSingle();

        if (data) {
          isKnownAccount = true;
          profile = {
            id: data.id,
            username: data.username,
            role: (targetAccount === "admin" ? "admin" : (data.role as "admin" | "user")),
            created_at: data.created_at,
          };

          if (data.password_hash) {
            try {
              isMatch = bcrypt.compareSync(password, data.password_hash);
            } catch {
              isMatch = false;
            }
          }
        }
      } catch (err) {
        console.error("Supabase profile check error:", err);
      }
    }

    if (!isKnownAccount) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    // Fallback credential check
    if (!isMatch) {
      if (targetAccount === "admin" && (password === "5555" || password === "123")) {
        isMatch = true;
      } else if (targetAccount === "tth" && password === "1") {
        isMatch = true;
      } else if (targetAccount === "tmh" && password === "2") {
        isMatch = true;
      } else if (targetAccount === "user" && password === "3") {
        isMatch = true;
      } else if (secMap[targetAccount]?.password_hash) {
        try {
          isMatch = bcrypt.compareSync(password, secMap[targetAccount].password_hash!);
        } catch {
          isMatch = false;
        }
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    // If profile was not found in Supabase, create fallback Profile object
    if (!profile) {
      const idMap: Record<string, string> = {
        admin: "00000000-0000-0000-0000-000000000001",
        tth: "00000000-0000-0000-0000-000000000002",
        tmh: "00000000-0000-0000-0000-000000000003",
        user: "00000000-0000-0000-0000-000000000004",
      };
      profile = {
        id: idMap[targetAccount] || crypto.randomUUID(),
        username: targetAccount,
        role: targetAccount === "admin" ? "admin" : ((secMap[targetAccount]?.role as "admin" | "user") || "user"),
        created_at: new Date().toISOString(),
      };
    }

    // Load Security State
    const sec = secMap[targetAccount] || {
      username: targetAccount,
      role: profile.role,
      is_active: true,
      ips: [],
      devices: [],
      updated_at: new Date().toISOString(),
    };

    // 1. Check if account is active (exempt admin)
    if (sec.is_active === false && profile.role !== "admin" && targetAccount !== "admin") {
      const lockMsg =
        Array.isArray(sec.devices) && sec.devices.length > 3
          ? "Tài khoản bị khóa do vượt quá số lượng 3 thiết bị cho phép. Vui lòng liên hệ Admin để giải quyết."
          : "Tài khoản đang bị tạm khóa (Off). Vui lòng liên hệ Quản trị viên để được mở lại.";
      return NextResponse.json(
        {
          error: lockMsg,
        },
        { status: 403 }
      );
    }

    // 2. IP Handling: Record for audit/reference only, NEVER trigger lockout
    if (Array.isArray(sec.ips) && !sec.ips.includes(clientIp)) {
      sec.ips.push(clientIp);
    }

    // 3. Track new Device ID if not yet registered
    if (!Array.isArray(sec.devices)) {
      sec.devices = [];
    }
    if (!sec.devices.includes(currentDevice)) {
      sec.devices.push(currentDevice);
    }

    sec.last_login_at = new Date().toISOString();
    sec.last_active_at = new Date().toISOString();
    sec.last_ip = clientIp; // Recorded for log/audit only
    sec.last_device = currentDevice;
    sec.current_activity = profile.role === "admin" ? "Bảng điều khiển Quản trị" : "Đang học / Làm bài";
    sec.updated_at = new Date().toISOString();

    // 4. DEVICE LIMIT CHECK: If devices > 3 -> AUTO DISABLE ACTIVE (Only for non-admin accounts)
    // IP is completely excluded from lockout logic.
    if (profile.role !== "admin" && targetAccount !== "admin" && sec.devices.length > 3) {
      sec.is_active = false;
      secMap[targetAccount] = sec;
      await saveSecurityMap(sb, secMap);

      return NextResponse.json(
        {
          error:
            "Tài khoản bị khóa do vượt quá số lượng 3 thiết bị cho phép. Vui lòng liên hệ Admin để giải quyết.",
        },
        { status: 403 }
      );
    }

    // Within limit -> update and persist
    secMap[targetAccount] = sec;
    await saveSecurityMap(sb, secMap);

    return NextResponse.json({
      success: true,
      user: {
        ...profile,
        is_active: sec.is_active,
      },
      security: sec,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi xác thực hệ thống.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
