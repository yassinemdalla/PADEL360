export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 22;

export const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

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
