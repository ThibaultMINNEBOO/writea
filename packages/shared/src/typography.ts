export const EM_DASH = "—";

const DIALOGUE_DASH = /^([ \t]*)-[ \t]+/gm;
const INCISE_DASH = /([ \t])-(?=[ \t])/g;

export function applyFrenchDashes(text: string): string {
  return text.replace(DIALOGUE_DASH, `$1${EM_DASH} `).replace(INCISE_DASH, `$1${EM_DASH}`);
}

/**
 * Called when `typed` is inserted right after `lineBefore`. Returns the text that must replace
 * the trailing hyphen and the typed character, or null when no substitution applies.
 */
export function dashReplacementForInput(lineBefore: string, typed: string): string | null {
  if (typed !== " " || !lineBefore.endsWith("-")) return null;
  const beforeDash = lineBefore.slice(0, -1);
  const isDialogue = beforeDash.trim() === "";
  const isIncise = /[ \t]$/.test(beforeDash);
  return isDialogue || isIncise ? `${EM_DASH} ` : null;
}
