import { redirect } from "next/navigation";

export default async function ChallengeIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/challenges/${id}/feed`);
}
