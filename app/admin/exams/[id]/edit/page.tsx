import { Suspense } from "react";
import { EditExamClient } from "./edit-exam-client";

export default function EditExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      }
    >
      <EditExamLoader params={params} />
    </Suspense>
  );
}

async function EditExamLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditExamClient examId={id} />;
}
