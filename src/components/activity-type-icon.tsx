import {
  Activity,
  Bike,
  Dumbbell,
  Footprints,
  HeartPulse,
  Mountain,
  Waves,
} from "lucide-react";

const PALETTE = [
  "bg-violet-500 shadow-violet-900/20",
  "bg-rose-500 shadow-rose-900/20",
  "bg-amber-500 shadow-amber-900/20",
  "bg-emerald-500 shadow-emerald-900/20",
  "bg-sky-500 shadow-sky-900/20",
] as const;

type ActivityKind =
  | "footprints"
  | "bike"
  | "waves"
  | "dumbbell"
  | "mountain"
  | "heart"
  | "activity";

function hashActivity(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickActivityKind(normalized: string): ActivityKind {
  if (
    /run|corrida|jog|5k|10k|marathon|maratona|treadmill|esteira/.test(
      normalized,
    )
  )
    return "footprints";
  if (/bike|cycle|ciclismo|bicicleta|spin/.test(normalized)) return "bike";
  if (/swim|nata[cç][aã]o|pool|piscina/.test(normalized)) return "waves";
  if (
    /cross|lift|muscula|strength|peso|gym|academia|wod|hiit|funcional/.test(
      normalized,
    )
  )
    return "dumbbell";
  if (/hike|trail|trilha|mountain|montanha|trek/.test(normalized))
    return "mountain";
  if (/walk|caminh/.test(normalized)) return "footprints";
  if (/yoga|pilates|stretch|alongamento|mobility/.test(normalized))
    return "heart";
  return "activity";
}

function ActivityGlyph({
  kind,
  className,
}: {
  kind: ActivityKind;
  className: string;
}) {
  const stroke = 2.25 as const;
  switch (kind) {
    case "footprints":
      return (
        <Footprints className={className} strokeWidth={stroke} />
      );
    case "bike":
      return <Bike className={className} strokeWidth={stroke} />;
    case "waves":
      return <Waves className={className} strokeWidth={stroke} />;
    case "dumbbell":
      return <Dumbbell className={className} strokeWidth={stroke} />;
    case "mountain":
      return <Mountain className={className} strokeWidth={stroke} />;
    case "heart":
      return <HeartPulse className={className} strokeWidth={stroke} />;
    default:
      return <Activity className={className} strokeWidth={stroke} />;
  }
}

export function ActivityTypeIcon({
  activityType,
  size = "md",
  className = "",
}: {
  activityType: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const kind = pickActivityKind(activityType.toLowerCase());
  const palette = PALETTE[hashActivity(activityType) % PALETTE.length];
  const box =
    size === "sm"
      ? "h-10 w-10"
      : size === "lg"
        ? "h-14 w-14"
        : "h-12 w-12";
  const icon =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-7 w-7" : "h-6 w-6";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-white shadow-md ${palette} ${box} ${className}`}
      aria-hidden
    >
      <ActivityGlyph kind={kind} className={icon} />
    </span>
  );
}
