"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCheckIn } from "@/app/actions/checkins";
import { addComment, toggleReaction } from "@/app/actions/social";
import { ActivityTypeIcon } from "@/components/activity-type-icon";
import { UserAvatar } from "@/components/user-avatar";

const EMOJIS = ["💪", "🔥", "👏", "❤️", "🎉"] as const;

export type CheckInCardProps = {
  id: string;
  activityType: string;
  durationMin: number;
  distanceKm: number | null;
  elevationM?: number | null;
  pointsEarned: number;
  photoUrl: string;
  description: string | null;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
  reactions: { emoji: string; userId: string }[];
  comments: {
    id: string;
    text: string;
    createdAt: string;
    user: { name: string };
  }[];
  currentUserId: string;
};

export function CheckInCard(props: CheckInCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [localComments, setLocalComments] = useState(props.comments);

  const counts = EMOJIS.map((emoji) => ({
    emoji,
    count: props.reactions.filter((r) => r.emoji === emoji).length,
    mine: props.reactions.some(
      (r) => r.emoji === emoji && r.userId === props.currentUserId,
    ),
  }));

  function onToggle(emoji: string) {
    startTransition(async () => {
      await toggleReaction(props.id, emoji);
      router.refresh();
    });
  }

  const isOwner = props.user.id === props.currentUserId;

  function onDelete() {
    if (
      !confirm(
        "Delete this check-in? Points and proof will be removed. This cannot be undone.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const r = await deleteCheckIn(props.id);
      if ("error" in r && r.error) {
        alert(r.error);
        return;
      }
      router.refresh();
    });
  }

  function onComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    const text = comment;
    setComment("");
    startTransition(async () => {
      const r = await addComment(props.id, text);
      if (!r.error) {
        setLocalComments((c) => [
          ...c,
          {
            id: "temp",
            text,
            createdAt: new Date().toISOString(),
            user: { name: "You" },
          },
        ]);
        router.refresh();
      }
    });
  }

  const at = new Date(props.createdAt);
  const timeLabel = at.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <article className="ui-surface overflow-hidden !rounded-2xl !p-0 !shadow-md">
      <div className="flex gap-3 p-4">
        <ActivityTypeIcon activityType={props.activityType} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-foreground leading-tight font-semibold tracking-tight">
              {props.activityType}
            </h3>
            <div className="flex shrink-0 items-center gap-2 pt-0.5">
              {isOwner && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={onDelete}
                  className="text-muted hover:text-destructive text-xs underline-offset-2 hover:underline"
                >
                  Delete
                </button>
              )}
              <time
                dateTime={props.createdAt}
                className="text-muted text-xs tabular-nums"
              >
                {timeLabel}
              </time>
            </div>
          </div>
          <div className="text-muted mt-2 flex items-center gap-2 text-xs">
            <UserAvatar name={props.user.name} imageUrl={props.user.image} size={22} />
            <span className="text-foreground/90 font-medium">
              {props.user.name}
            </span>
          </div>
          <p className="text-muted mt-2 text-sm">
            {props.durationMin} min
            {props.distanceKm != null && ` · ${props.distanceKm} km`}
            {props.elevationM != null &&
              props.elevationM > 0 &&
              ` · +${props.elevationM} m elev.`}
            {" · "}
            <span className="text-accent font-semibold">
              +{props.pointsEarned} pts
            </span>
          </p>
          {props.description && (
            <p className="text-muted mt-1.5 text-sm leading-relaxed">
              {props.description}
            </p>
          )}
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={props.photoUrl}
        alt="Check-in proof"
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="border-border flex flex-wrap gap-2 border-t border-zinc-100 bg-zinc-50/50 px-3 py-3">
        {counts.map(({ emoji, count, mine }) => (
          <button
            key={emoji}
            type="button"
            disabled={pending}
            onClick={() => onToggle(emoji)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              mine
                ? "bg-violet-100 text-violet-950 ring-2 ring-violet-300/60"
                : "bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200/80 hover:bg-zinc-50"
            }`}
          >
            {emoji} {count > 0 ? count : ""}
          </button>
        ))}
      </div>
      <div className="border-border border-t border-zinc-100 px-4 py-3">
        <ul className="text-muted max-h-40 space-y-1 overflow-y-auto text-sm">
          {localComments.map((c) => (
            <li key={c.id}>
              <span className="text-foreground font-medium">{c.user.name}</span>
              {": "}
              {c.text}
            </li>
          ))}
        </ul>
        <form onSubmit={onComment} className="mt-2 flex gap-2">
          <input
            className="ui-input min-h-0 flex-1 !py-2 text-sm"
            placeholder="Comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="submit"
            disabled={pending}
            className="ui-btn-primary !shrink-0 !px-4 !py-2 text-sm"
          >
            Send
          </button>
        </form>
      </div>
    </article>
  );
}
