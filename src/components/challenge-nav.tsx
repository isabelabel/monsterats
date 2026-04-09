"use client";

import {
  CirclePlus,
  House,
  LayoutList,
  Trophy,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ChallengeNav({
  challengeId,
  allowCheckIn = false,
}: {
  challengeId: string;
  /** When true, show a dedicated “Log” tab (challenge must be active). */
  allowCheckIn?: boolean;
}) {
  const pathname = usePathname();
  const base = `/challenges/${challengeId}`;
  const tabs: {
    href: string;
    label: string;
    Icon: typeof LayoutList;
    match: (p: string) => boolean;
  }[] = [
    {
      href: `${base}/feed`,
      label: "Feed",
      Icon: LayoutList,
      match: (p: string) => p.includes("/feed"),
    },
  ];
  if (allowCheckIn) {
    tabs.push({
      href: `${base}/check-in`,
      label: "Log",
      Icon: CirclePlus,
      match: (p: string) => p.includes("/check-in"),
    });
  }
  tabs.push(
    {
      href: `${base}/leaderboard`,
      label: "Board",
      Icon: Trophy,
      match: (p: string) => p.includes("/leaderboard"),
    },
    {
      href: `${base}/profile`,
      label: "You",
      Icon: UserRound,
      match: (p: string) =>
        p.includes(`/challenges/${challengeId}/profile`),
    },
    {
      href: "/",
      label: "Challenges",
      Icon: House,
      /** Home list is never “active” while this nav is shown (challenge layout only). */
      match: () => false,
    },
  );

  return (
    <nav className="border-border/80 bg-card/95 fixed right-3 bottom-4 left-3 z-40 mx-auto flex max-w-lg justify-around rounded-[1.75rem] border px-1 py-2.5 shadow-lg shadow-zinc-900/10 backdrop-blur-md">
      {tabs.map((t) => {
        const active = t.match(pathname);
        const { Icon } = t;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex min-w-[3.25rem] flex-col items-center gap-1 rounded-xl px-2 py-1 transition-all ${
              active
                ? "text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                active
                  ? "bg-accent text-white shadow-md shadow-purple-900/25"
                  : "bg-zinc-100/90 text-current"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            </span>
            <span className="max-w-[4.5rem] truncate text-center text-[11px] font-semibold leading-none">
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
