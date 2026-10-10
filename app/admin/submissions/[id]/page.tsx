import { Suspense } from "react";
import { GradingRoomClient } from "./grading-room-client";

export default function AdminGradingRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
        </div>
      }
    >
      <GradingLoader params={params} />
    </Suspense>
  );
}

async function GradingLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GradingRoomClient submissionId={id} />;
}
