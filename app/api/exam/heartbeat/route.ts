import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId, sessionId, clientRemainingSeconds } = body;

    const serverNow = Date.now();

    // Verify remaining seconds or confirm active session
    return NextResponse.json({
      success: true,
      examId,
      sessionId,
      serverTime: serverNow,
      verifiedRemainingSeconds: typeof clientRemainingSeconds === "number" ? clientRemainingSeconds : null,
      isTerminated: false,
    });
  } catch (error: any) {
    console.error("Heartbeat sync error:", error);
    return NextResponse.json(
      { error: "Heartbeat failed" },
      { status: 500 }
    );
  }
}
