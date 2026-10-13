import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUsername, newPassword, newUsername } = body;

    if (!targetUsername) {
      return NextResponse.json(
        { error: "Vui lòng chỉ định tài khoản cần cập nhật thông tin" },
        { status: 400 }
      );
    }

    const cleanTarget = String(targetUsername).trim().toLowerCase();
    const cleanNewUsername = newUsername ? String(newUsername).trim().toLowerCase() : cleanTarget;
    const isUsernameChanging = cleanNewUsername !== cleanTarget;
    const isPasswordChanging = Boolean(newPassword && String(newPassword).trim().length > 0);

    if (!isUsernameChanging && !isPasswordChanging) {
      return NextResponse.json(
        { error: "Chưa có thông tin nào thay đổi. Vui lòng nhập Username mới hoặc Mật khẩu mới." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let hash: string | undefined;
    if (isPasswordChanging) {
      hash = bcrypt.hashSync(String(newPassword).trim(), 10);
    }

    if (supabaseUrl && supabaseKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

      // 1. If username is changing, verify that the new username doesn't already exist
      if (isUsernameChanging) {
        const { data: existingUser, error: checkError } = await supabaseAdmin
          .from("profiles")
          .select("id, username")
          .eq("username", cleanNewUsername)
          .maybeSingle();

        if (checkError) {
          return NextResponse.json(
            { error: `Lỗi kiểm tra tên đăng nhập: ${checkError.message}` },
            { status: 500 }
          );
        }

        if (existingUser) {
          return NextResponse.json(
            { error: `Tên đăng nhập mới '${cleanNewUsername}' đã tồn tại trong hệ thống. Vui lòng chọn tên khác.` },
            { status: 400 }
          );
        }
      }

      // 2. Prepare update payload for profiles
      const updatePayload: Record<string, any> = {};
      if (isUsernameChanging) {
        updatePayload.username = cleanNewUsername;
      }
      if (isPasswordChanging && hash) {
        updatePayload.password_hash = hash;
      }

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(updatePayload)
        .eq("username", cleanTarget)
        .select();

      if (error) {
        return NextResponse.json(
          { error: `Lỗi cập nhật CSDL: ${error.message}` },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: `Không tìm thấy tài khoản '${cleanTarget}' trong hệ thống` },
          { status: 404 }
        );
      }

      // 3. Update security map in __SYSTEM_ACCOUNT_SECURITY__
      try {
        const { data: secData } = await supabaseAdmin
          .from("exams")
          .select("id, description")
          .eq("title", "__SYSTEM_ACCOUNT_SECURITY__")
          .maybeSingle();

        if (secData && secData.description) {
          const map = JSON.parse(secData.description);
          const targetRecord = map[cleanTarget] || {
            username: cleanTarget,
            role: data[0].role || "user",
            is_active: true,
            ips: [],
            devices: [],
            updated_at: new Date().toISOString(),
          };

          if (hash) {
            targetRecord.password_hash = hash;
          }
          targetRecord.updated_at = new Date().toISOString();

          if (isUsernameChanging) {
            targetRecord.username = cleanNewUsername;
            map[cleanNewUsername] = targetRecord;
            delete map[cleanTarget];
          } else {
            map[cleanTarget] = targetRecord;
          }

          await supabaseAdmin
            .from("exams")
            .update({ description: JSON.stringify(map) })
            .eq("id", secData.id);
        }
      } catch (secErr) {
        console.error("Failed to sync secMap in reset-password:", secErr);
      }

      const detailMsg = isUsernameChanging && isPasswordChanging
        ? `Đã đổi username thành '${cleanNewUsername}' và cập nhật mật khẩu mới thành công`
        : isUsernameChanging
        ? `Đã đổi username từ '${cleanTarget}' thành '${cleanNewUsername}' thành công`
        : `Đã đổi mật khẩu cho tài khoản '${cleanTarget}' thành công`;

      return NextResponse.json({
        success: true,
        message: detailMsg,
        newUsername: cleanNewUsername,
        user: data[0],
      });
    }

    const localDetail = isUsernameChanging && isPasswordChanging
      ? `Đã đổi username thành '${cleanNewUsername}' và cập nhật mật khẩu (Chế độ cục bộ)`
      : isUsernameChanging
      ? `Đã đổi username thành '${cleanNewUsername}' (Chế độ cục bộ)`
      : `Đã đổi mật khẩu cho tài khoản '${cleanTarget}' (Chế độ cục bộ)`;

    return NextResponse.json({
      success: true,
      message: localDetail,
      newUsername: cleanNewUsername,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
