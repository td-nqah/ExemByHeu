import { Suspense } from "react";
import { KnowledgeReaderClient } from "./knowledge-reader-client";

export default function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      }
    >
      <KnowledgeDetailLoader params={params} />
    </Suspense>
  );
}

async function KnowledgeDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KnowledgeReaderClient materialId={id} />;
}
