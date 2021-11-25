export const MILLISECOND_TO_SECOND_DIVIDER = 1000;

export function unixTimestamp(): number {
  return Math.floor(Date.now() / MILLISECOND_TO_SECOND_DIVIDER);
}
