import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId, sessionId, violationCount, timestamp, reason } = body;

    console.warn(`[SECURITY AUDIT] Exam Room Violation recorded:`, {
      examId,
      sessionId,
      violationCount,
      timestamp: timestamp || new Date().toISOString(),
      reason: reason || "TAB_OR_WINDOW_BLUR_SWITCH",
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      examId,
      sessionId,
      violationCount,
      receivedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Failed to log exam violation:", error);
    return NextResponse.json(
      { error: "Failed to log violation" },
      { status: 500 }
    );
  }
}
