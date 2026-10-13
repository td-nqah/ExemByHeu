import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { AccountSecurity } from "@/types/exam";

const DEFAULT_SECURITY_MAP: Record<string, AccountSecurity> = {
  adm: {
    username: "adm",
    role: "admin",
    is_active: true,
    ips: ["127.0.0.1"],
    devices: ["Windows (Chrome)"],
    last_active_at: new Date().toISOString(),
    last_ip: "127.0.0.1",
    last_device: "Windows (Chrome)",
    current_activity: "Bảng Quản trị & Phân quyền",
    updated_at: new Date().toISOString(),
  },
  tth: {
    username: "tth",
    role: "user",
    is_active: true,
    ips: [],
    devices: [],
    current_activity: "Chưa trực tuyến",
    updated_at: new Date().toISOString(),
  },
  tmh: {
    username: "tmh",
    role: "user",
    is_active: true,
    ips: [],
    devices: [],
    current_activity: "Chưa trực tuyến",
    updated_at: new Date().toISOString(),
  },
  user: {
    username: "user",
    role: "user",
    is_active: true,
    ips: [],
    devices: [],
    current_activity: "Chưa trực tuyến",
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

export async function GET() {
  try {
    const sb = getSupabaseAdmin();
    const secMap = await getSecurityMap(sb);

    // Ensure super admin account is always active
    if (secMap.adm && secMap.adm.is_active === false) {
      secMap.adm.is_active = true;
      await saveSecurityMap(sb, secMap);
    }

    const accounts = Object.values(secMap);
    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi tải thông tin tài khoản.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, is_active, password, role } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Vui lòng chỉ định tài khoản cần cấu hình." },
        { status: 400 }
      );
    }

    const cleanUser = String(username).trim().toLowerCase();
    const sb = getSupabaseAdmin();
    const secMap = await getSecurityMap(sb);

    if (action === "create_account") {
      if (!password || String(password).trim().length === 0) {
        return NextResponse.json(
          { error: "Vui lòng nhập mật khẩu cho tài khoản mới." },
          { status: 400 }
        );
      }

      if (cleanUser.length < 2) {
        return NextResponse.json(
          { error: "Tên tài khoản phải có ít nhất 2 ký tự." },
          { status: 400 }
        );
      }

      // Check if user already exists
      if (secMap[cleanUser] && (["adm", "tth", "tmh", "user"].includes(cleanUser) || secMap[cleanUser].password_hash)) {
        return NextResponse.json(
          { error: `Tài khoản '${cleanUser}' đã tồn tại trong hệ thống.` },
          { status: 400 }
        );
      }

      const assignedRole = role === "admin" ? "admin" : "user";
      const hash = bcrypt.hashSync(String(password).trim(), 10);

      // Insert into Supabase if configured
      if (sb) {
        try {
          const { data: existingProf } = await sb
            .from("profiles")
            .select("id")
            .ilike("username", cleanUser)
            .maybeSingle();

          if (existingProf) {
            return NextResponse.json(
              { error: `Tài khoản '${cleanUser}' đã tồn tại trong cơ sở dữ liệu.` },
              { status: 400 }
            );
          }

          await sb.from("profiles").insert({
            id: crypto.randomUUID(),
            username: cleanUser,
            password_hash: hash,
            role: assignedRole,
            created_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.error("Error creating profile in Supabase:", dbErr);
        }
      }

      secMap[cleanUser] = {
        username: cleanUser,
        role: assignedRole,
        is_active: true,
        ips: [],
        devices: [],
        password_hash: hash,
        updated_at: new Date().toISOString(),
      };
      await saveSecurityMap(sb, secMap);

      return NextResponse.json({
        success: true,
        message: `Đã tạo thành công tài khoản '${cleanUser}' (${assignedRole === "admin" ? "Quản trị viên" : "Thí sinh"}).`,
        account: secMap[cleanUser],
      });
    }

    if (!secMap[cleanUser]) {
      secMap[cleanUser] = {
        username: cleanUser,
        role: cleanUser === "adm" ? "admin" : "user",
        is_active: true,
        ips: [],
        devices: [],
        updated_at: new Date().toISOString(),
      };
    }

    if (action === "toggle_active") {
      if ((cleanUser === "adm" || secMap[cleanUser]?.role === "admin") && !is_active) {
        return NextResponse.json(
          { error: "Không thể tắt kích hoạt tài khoản Quản trị viên (Admin) để tránh tự khóa hệ thống." },
          { status: 400 }
        );
      }
      secMap[cleanUser].is_active = Boolean(is_active);
      secMap[cleanUser].updated_at = new Date().toISOString();
      await saveSecurityMap(sb, secMap);

      return NextResponse.json({
        success: true,
        message: `Đã ${secMap[cleanUser].is_active ? "mở kích hoạt (Active)" : "tắt kích hoạt (Khóa)"} cho tài khoản '${cleanUser}' thành công.`,
        security: secMap[cleanUser],
      });
    }

    if (action === "reset_security") {
      secMap[cleanUser].ips = [];
      secMap[cleanUser].devices = [];
      secMap[cleanUser].is_active = true;
      secMap[cleanUser].updated_at = new Date().toISOString();
      await saveSecurityMap(sb, secMap);

      return NextResponse.json({
        success: true,
        message: `Đã đặt lại bộ đếm IP & Thiết bị (0/3) và mở khóa cho tài khoản '${cleanUser}'.`,
        security: secMap[cleanUser],
      });
    }

    if (action === "heartbeat" || action === "ping") {
      const activity = body.activity || "Đang trực tuyến";
      const forwarded = req.headers.get("x-forwarded-for");
      const clientIp =
        (forwarded ? forwarded.split(",")[0].trim() : null) ||
        req.headers.get("x-real-ip") ||
        body.ip ||
        "127.0.0.1";
      const userAgent = req.headers.get("user-agent") || "";
      const device =
        body.device ||
        (userAgent.includes("Windows")
          ? "Windows (Chrome/Edge)"
          : userAgent.includes("Mac")
          ? "macOS (Safari/Chrome)"
          : userAgent.includes("iPhone")
          ? "iPhone (Mobile)"
          : userAgent.includes("Android")
          ? "Android (Mobile)"
          : "Trình duyệt Web");

      secMap[cleanUser].last_active_at = new Date().toISOString();
      secMap[cleanUser].last_ip = clientIp;
      secMap[cleanUser].last_device = device;
      secMap[cleanUser].current_activity = String(activity);
      secMap[cleanUser].updated_at = new Date().toISOString();
      await saveSecurityMap(sb, secMap);

      return NextResponse.json({
        success: true,
        last_active_at: secMap[cleanUser].last_active_at,
        current_activity: secMap[cleanUser].current_activity,
        security: secMap[cleanUser],
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi cập nhật cấu hình tài khoản.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
