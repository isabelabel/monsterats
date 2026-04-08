import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getSession } from "@/lib/session";

export default async function ChallengeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect(
      `/login?next=${encodeURIComponent(`/challenges/${id}/profile`)}`,
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <p className="text-muted text-sm leading-relaxed">
        Account settings for this challenge context — use{" "}
        <strong className="text-foreground">Feed</strong> or{" "}
        <strong className="text-foreground">Board</strong> below to go back.
      </p>
      <div className="pt-4">
        <ProfileForm
          initialName={session.user.name}
          initialImage={session.user.image ?? null}
        />
      </div>
    </div>
  );
}
