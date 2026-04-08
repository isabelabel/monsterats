import { formatInTimeZone, toDate } from "date-fns-tz";

export function dateKeyInTimezone(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd");
}

function noonOnDateKey(dateKey: string, timeZone: string): Date {
  return toDate(`${dateKey}T12:00:00`, { timeZone });
}

export function eligibleDaysInChallenge(
  start: Date,
  end: Date,
  now: Date,
  timeZone: string,
): number {
  const endBound = now.getTime() < end.getTime() ? now : end;
  if (endBound.getTime() < start.getTime()) return 0;
  const sk = dateKeyInTimezone(start, timeZone);
  const ek = dateKeyInTimezone(endBound, timeZone);
  const ms =
    noonOnDateKey(ek, timeZone).getTime() - noonOnDateKey(sk, timeZone).getTime();
  return Math.max(0, Math.floor(ms / 86400000) + 1);
}

export function totalCalendarDaysInChallenge(
  start: Date,
  end: Date,
  timeZone: string,
): number {
  const sk = dateKeyInTimezone(start, timeZone);
  const ek = dateKeyInTimezone(end, timeZone);
  const ms =
    noonOnDateKey(ek, timeZone).getTime() - noonOnDateKey(sk, timeZone).getTime();
  return Math.max(1, Math.floor(ms / 86400000) + 1);
}
