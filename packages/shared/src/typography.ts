export const EM_DASH = "—";

const DIALOGUE_DASH = /^([ \t]*)-[ \t]+/gm;
const INCISE_DASH = /([ \t])-(?=[ \t])/g;

export function applyFrenchDashes(text: string): string {
  return text.replace(DIALOGUE_DASH, `$1${EM_DASH} `).replace(INCISE_DASH, `$1${EM_DASH}`);
}

export type DashInputChange = { removeBefore: number; insert: string };

/**
 * Computes the edit to apply when `typed` is inserted after `lineBefore`. Only dashes adjacent to
 * the insertion are converted, so a hyphen the author deliberately kept earlier stays untouched.
 */
export function dashInputChange(lineBefore: string, typed: string): DashInputChange | null {
  const combined = lineBefore + typed;
  const fixed = applyFrenchDashes(combined);
  if (fixed === combined) return null;
  let prefix = 0;
  while (prefix < combined.length && combined[prefix] === fixed[prefix]) prefix++;
  if (prefix < lineBefore.length - 1) return null;
  const removeBefore = Math.max(0, lineBefore.length - prefix);
  return { removeBefore, insert: fixed.slice(lineBefore.length - removeBefore) };
}
