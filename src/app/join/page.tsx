import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinForm } from "@/components/join-form";
import { performJoin } from "@/app/actions/join";
import { getSession } from "@/lib/session";

export default async function JoinEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const code = sp.code?.trim();
  let joinError: string | undefined;
  if (code && session) {
    const r = await performJoin(session.user.id, code);
    if (r.ok) redirect(`/challenges/${r.challengeId}/feed`);
    joinError = r.error;
  }
  if (code && !session) {
    redirect(
      `/login?next=${encodeURIComponent(`/join?code=${encodeURIComponent(code)}`)}`,
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Join challenge</h1>
      <p className="text-muted mt-3 text-sm leading-relaxed">
        Enter the invite code from your organizer.
      </p>
      {!session && (
        <p className="text-muted mt-3 text-sm">
          <Link href="/login" className="text-accent font-medium underline">
            Sign in
          </Link>{" "}
          first.
        </p>
      )}
      <div className="ui-surface mt-8 p-6">
        <JoinForm initialCode={code} initialError={joinError} />
      </div>
    </div>
  );
}
