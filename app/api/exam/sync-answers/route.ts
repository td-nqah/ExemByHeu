import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { examId, sessionId, answers, timestamp } = body;

    return NextResponse.json({
      success: true,
      examId,
      sessionId,
      syncedAnswersCount: Object.keys(answers || {}).length,
      syncedAt: timestamp || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Answer sync error:", error);
    return NextResponse.json(
      { error: "Sync answers failed" },
      { status: 500 }
    );
  }
}
