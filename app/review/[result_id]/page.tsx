import { Suspense } from "react";
import { SubmissionReviewClient } from "@/app/history/[submissionId]/submission-review-client";

export default function ReviewPage({
  params,
}: {
  params: Promise<{ result_id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <ReviewLoader params={params} />
    </Suspense>
  );
}

async function ReviewLoader({
  params,
}: {
  params: Promise<{ result_id: string }>;
}) {
  const { result_id } = await params;
  return <SubmissionReviewClient submissionId={result_id} />;
}
