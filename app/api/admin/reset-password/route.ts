import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUsername, newPassword } = body;

    if (!targetUsername || !newPassword) {
      return NextResponse.json(
        { error: "Tên đăng nhập và mật khẩu mới không được để trống" },
        { status: 400 }
      );
    }

    const cleanUsername = String(targetUsername).trim().toLowerCase();
    const hash = bcrypt.hashSync(newPassword, 10);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update({ password_hash: hash })
        .eq("username", cleanUsername)
        .select();

      if (error) {
        return NextResponse.json(
          { error: `Lỗi cập nhật CSDL: ${error.message}` },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: `Không tìm thấy tài khoản '${cleanUsername}' trong hệ thống` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Đã đổi mật khẩu cho tài khoản '${cleanUsername}' thành công`,
        user: data[0],
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã đổi mật khẩu cho tài khoản '${cleanUsername}' (Chế độ cục bộ)`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
