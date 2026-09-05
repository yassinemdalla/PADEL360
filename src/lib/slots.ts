export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 22;

export const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

/** Bookable start hours for a court, from its configured open hours. */
export function courtHours(openFrom: number, openTo: number) {
  const from = Math.max(0, openFrom);
  const to = Math.min(24, openTo);
  return Array.from({ length: Math.max(0, to - from - 1 + 1) }, (_, i) => from + i).filter((h) => h + 1 <= to);
}

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** Start of a one hour slot on the given day, in the visitor's local timezone. */
export function slotStart(day: Date, hour: number) {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export function slotEnd(day: Date, hour: number) {
  return slotStart(day, hour + 1);
}

export function dayBounds(day: Date) {
  const from = new Date(day);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from, to };
}

export function overlaps(aStart: Date, aEnd: Date, bStart: string, bEnd: string) {
  return aStart < new Date(bEnd) && aEnd > new Date(bStart);
}

export function euros(cents: number) {
  return `€${(cents / 100).toFixed(0)}`;
}

export function todayLabel(day: Date) {
  return day.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

export function dayKey(day: Date) {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function nextDays(count: number) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeRange(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${t(s)} – ${t(e)}`;
}
