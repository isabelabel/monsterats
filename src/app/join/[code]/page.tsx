import Link from "next/link";
import { redirect } from "next/navigation";
import { performJoin } from "@/app/actions/join";
import { getSession } from "@/lib/session";

export default async function JoinCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await getSession();
  if (!session) {
    redirect(
      `/login?next=${encodeURIComponent(`/join/${encodeURIComponent(code)}`)}`,
    );
  }
  const r = await performJoin(session.user.id, code);
  if (!r.ok) {
    return (
      <div className="mx-auto max-w-sm px-4 py-10">
        <div className="ui-surface rounded-2xl border-red-100 bg-red-50/50 p-5">
          <p className="text-sm text-red-800">{r.error}</p>
        </div>
        <Link
          href="/join"
          className="text-accent mt-5 inline-block text-sm font-medium underline"
        >
          Try another code
        </Link>
      </div>
    );
  }
  redirect(`/challenges/${r.challengeId}/feed`);
}
