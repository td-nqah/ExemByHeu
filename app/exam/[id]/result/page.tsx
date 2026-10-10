import { Suspense } from "react";
import { ExamResultClient } from "./result-client";

export default function ExamResultSummaryPage({
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
      <ExamResultLoader params={params} />
    </Suspense>
  );
}

async function ExamResultLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExamResultClient examId={id} />;
}
