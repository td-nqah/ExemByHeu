import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { AccountSecurity, Profile } from "@/types/exam";

const DEFAULT_SECURITY_MAP: Record<string, AccountSecurity> = {
  adm: {
    username: "adm",
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
      return { ...DEFAULT_SECURITY_MAP, ...parsed };
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
    let targetAccount = inputUser;

    // Map 'admin' alias to 'adm'
    if (inputUser === "admin") {
      targetAccount = "adm";
    }

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
      ["adm", "tth", "tmh", "user"].includes(targetAccount) ||
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
            role: data.role as "admin" | "user",
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
      if (targetAccount === "adm" && password === "5555") {
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
        adm: "00000000-0000-0000-0000-000000000001",
        tth: "00000000-0000-0000-0000-000000000002",
        tmh: "00000000-0000-0000-0000-000000000003",
        user: "00000000-0000-0000-0000-000000000004",
      };
      profile = {
        id: idMap[targetAccount] || crypto.randomUUID(),
        username: targetAccount,
        role: (secMap[targetAccount]?.role as "admin" | "user") || "user",
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
    if (sec.is_active === false && profile.role !== "admin" && targetAccount !== "adm") {
      return NextResponse.json(
        {
          error:
            "Tài khoản đang bị tạm khóa (Tắt Active). Vui lòng liên hệ Quản trị viên để được mở lại.",
        },
        { status: 403 }
      );
    }

    // 2. Track new IP if not yet registered
    if (!sec.ips.includes(clientIp)) {
      sec.ips.push(clientIp);
    }

    // 3. Track new Device if not yet registered
    if (!sec.devices.includes(currentDevice)) {
      sec.devices.push(currentDevice);
    }

    sec.last_login_at = new Date().toISOString();
    sec.last_active_at = new Date().toISOString();
    sec.last_ip = clientIp;
    sec.last_device = currentDevice;
    sec.current_activity = profile.role === "admin" ? "Bảng điều khiển Quản trị" : "Đang học / Làm bài";
    sec.updated_at = new Date().toISOString();

    // 4. RULE: If > 3 IPs OR > 3 Devices -> AUTO DISABLE ACTIVE (Only for non-admin accounts)
    if (profile.role !== "admin" && targetAccount !== "adm" && (sec.ips.length > 3 || sec.devices.length > 3)) {
      sec.is_active = false;
      secMap[targetAccount] = sec;
      await saveSecurityMap(sb, secMap);

      const reason =
        sec.ips.length > 3
          ? `vượt quá 3 địa chỉ IP (${sec.ips.length}/3 IP: ${sec.ips.slice(0, 3).join(", ")}...)`
          : `vượt quá 3 thiết bị đăng nhập (${sec.devices.length}/3 thiết bị)`;

      return NextResponse.json(
        {
          error: `Tài khoản đã bị tự động vô hiệu hóa (Tắt Active) do ${reason}. Vui lòng liên hệ Admin tại Cài đặt Hệ thống để kích hoạt lại.`,
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
