import { redirect } from "next/navigation";
import { ChallengeWizard } from "@/components/challenge-wizard";
import { getSession } from "@/lib/session";

export default async function NewChallengePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/challenges/new");

  return (
    <div className="pb-10">
      <h1 className="px-4 pt-8 text-2xl font-semibold tracking-tight">
        New challenge
      </h1>
      <ChallengeWizard />
    </div>
  );
}
