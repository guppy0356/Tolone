// Called by the list and the detail page, wired by nothing. No Intl: the
// runner's locale must not change what a test sees.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-09-01" → "Sep 1, 2026"
export function toDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
}
