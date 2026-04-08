import { ChevronRight, Dumbbell } from "lucide-react";
import Link from "next/link";
import { listMyChallenges } from "@/app/actions/challenges";
import { getChallengeStatus } from "@/lib/challenges/status";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Fitness challenges, your rules
        </h1>
        <p className="text-muted mt-3 text-sm leading-relaxed">
          Create GymRats-style challenges with fixed, duration, distance, or
          conversion scoring, composite leaderboards, and a social check-in
          feed.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="ui-btn-primary inline-flex justify-center px-8"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="ui-btn-secondary inline-flex justify-center px-8"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const mine = await listMyChallenges();

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <p className="text-muted text-sm">
        Signed in as <strong className="text-foreground">{session.user.name}</strong>
      </p>
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your challenges</h2>
        <Link
          href="/challenges/new"
          className="text-accent text-sm font-medium"
        >
          + New
        </Link>
      </div>
      {mine.length === 0 ? (
        <p className="text-muted mt-6 text-sm">
          You have not joined any challenge yet. Create one or ask a teammate
          for an invite link.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {mine.map((c) => {
            const st = getChallengeStatus(c.startDate, c.endDate);
            return (
              <li key={c.id}>
                <Link
                  href={`/challenges/${c.id}/feed`}
                  className="ui-surface hover:border-violet-300/60 flex items-center gap-3 !rounded-2xl !p-4 transition-colors"
                >
                  <span className="bg-violet-100 text-violet-800 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-inner shadow-violet-900/5">
                    <Dumbbell className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted mt-1 block text-xs capitalize">
                      {st} · code {c.inviteCode}
                    </span>
                  </div>
                  <ChevronRight
                    className="text-muted h-5 w-5 shrink-0 opacity-60"
                    strokeWidth={2}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href="/join"
        className="text-muted mt-8 block text-center text-sm underline"
      >
        Join with invite code
      </Link>
    </div>
  );
}
