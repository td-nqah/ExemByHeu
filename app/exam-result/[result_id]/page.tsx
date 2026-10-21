import { redirect } from "next/navigation";

export default async function ExamResultPage({
  params,
}: {
  params: Promise<{ result_id: string }>;
}) {
  const { result_id } = await params;
  redirect(`/history/${result_id}`);
}

