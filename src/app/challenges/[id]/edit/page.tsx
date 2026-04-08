import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditChallengeCoverForm } from "@/components/edit-challenge-cover-form";
import { EditChallengeForm } from "@/components/edit-challenge-form";
import { db } from "@/db";
import { challenges } from "@/db/schema";
import { getChallengeStatus } from "@/lib/challenges/status";
import { getSession } from "@/lib/session";

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/challenges/${id}/edit`);

  const ch = await db.query.challenges.findFirst({
    where: eq(challenges.id, id),
  });
  if (!ch) redirect("/");
  if (ch.creatorId !== session.user.id) redirect(`/challenges/${id}/feed`);

  const status = getChallengeStatus(ch.startDate, ch.endDate);

  if (status !== "upcoming") {
    return (
      <div className="pb-10">
        <div className="mx-auto max-w-lg px-4 pt-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Challenge cover
          </h1>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Dates and scoring rules are locked while the challenge is active or
            finished. As the organizer, you can still replace the cover image.
          </p>
          <Link
            href={`/challenges/${id}/feed`}
            className="text-accent mt-4 inline-block text-sm font-medium underline"
          >
            ← Back to feed
          </Link>
        </div>
        <EditChallengeCoverForm challenge={ch} />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <h1 className="px-4 pt-8 text-2xl font-semibold tracking-tight">
        Edit challenge
      </h1>
      <EditChallengeForm challenge={ch} />
    </div>
  );
}
