/**
 * The contract's timestamps are UTC ISO strings. Formatting them through Intl
 * would make the rendered text depend on the runner's locale and ICU version,
 * so the view model states the zone instead of guessing one.
 */
export function formatInstant(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}
