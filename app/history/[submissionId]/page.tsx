import { Suspense } from "react";
import { SubmissionReviewClient } from "./submission-review-client";

export default function SubmissionReviewPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
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
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  return <SubmissionReviewClient submissionId={submissionId} />;
}
