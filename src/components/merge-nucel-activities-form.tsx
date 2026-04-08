import { mergeNucelActivitiesFormAction } from "@/app/actions/challenges";

/** Organizer-only: append activities from `public/templates/nucel.json` missing from this challenge. */
export function MergeNucelActivitiesForm({
  challengeId,
}: {
  challengeId: string;
}) {
  return (
    <form action={mergeNucelActivitiesFormAction} className="inline">
      <input type="hidden" name="challengeId" value={challengeId} />
      <button
        type="submit"
        className="text-muted hover:text-accent text-left text-xs underline"
      >
        Add missing activities from latest NuCel list
      </button>
    </form>
  );
}
