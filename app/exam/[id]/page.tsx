import { Suspense } from "react";
import { ExamRoomClient } from "./exam-room-client";

export default function ExamRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
        </div>
      }
    >
      <ExamRoomLoader params={params} />
    </Suspense>
  );
}

async function ExamRoomLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExamRoomClient examId={id} />;
}
