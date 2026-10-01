export const EM_DASH = "—";
export const NBSP = "\u00a0";

const DIALOGUE_DASH = /^([ \t]*)-[ \t]+/gm;
const INCISE_DASH = /([ \t])-(?=[ \t])/g;
const INNER_SPACE = /[ \t\u00a0\u202f]/;
const TRAILING_SPACES = /[ \t\u00a0\u202f]+$/;
const PARAGRAPH_BREAK = /\n[ \t]*\n/;

export function applyFrenchDashes(text: string): string {
  return text.replace(DIALOGUE_DASH, `$1${EM_DASH} `).replace(INCISE_DASH, `$1${EM_DASH}`);
}

function isQuoteOpen(preceding: string) {
  const paragraph = preceding.split(PARAGRAPH_BREAK).pop() ?? "";
  let depth = 0;
  for (const char of paragraph) {
    if (char === "«") depth++;
    else if (char === "»") depth = Math.max(0, depth - 1);
  }
  return depth > 0;
}

function quoteKind(char: string, preceding: string): "open" | "close" | null {
  if (char === "«" || char === "“") return "open";
  if (char === "»" || char === "”") return "close";
  if (char !== '"') return null;
  return isQuoteOpen(preceding) ? "close" : "open";
}

/**
 * Converts straight and English quotes into French guillemets with non-breaking spaces.
 * A straight quote closes the guillemet left open in the current paragraph, otherwise it opens one.
 * `before` is the text preceding `text`.
 */
export function applyFrenchQuotes(text: string, before = ""): string {
  let output = "";
  let index = 0;
  while (index < text.length) {
    const char = text.charAt(index);
    const kind = quoteKind(char, before + output);
    index++;
    if (kind === "open") {
      output += `«${NBSP}`;
      while (index < text.length && INNER_SPACE.test(text.charAt(index))) index++;
    } else if (kind === "close") {
      output = `${output.replace(TRAILING_SPACES, "")}${NBSP}»`;
    } else {
      output += char;
    }
  }
  return output;
}

export function applyFrenchTypography(text: string): string {
  return applyFrenchQuotes(applyFrenchDashes(text));
}

export type TypographyInputChange = { removeBefore: number; insert: string };

/**
 * Computes the edit to apply when `typed` is inserted after `lineBefore`. Only characters adjacent
 * to the insertion are converted, so a hyphen the author deliberately kept earlier stays untouched.
 */
export function typographyInputChange(
  lineBefore: string,
  typed: string,
): TypographyInputChange | null {
  const combined = lineBefore + typed;
  const fixed = applyFrenchTypography(combined);
  if (fixed === combined) return null;
  let prefix = 0;
  while (prefix < combined.length && combined[prefix] === fixed[prefix]) prefix++;
  if (prefix < lineBefore.length - 1) return null;
  const removeBefore = Math.max(0, lineBefore.length - prefix);
  return { removeBefore, insert: fixed.slice(lineBefore.length - removeBefore) };
}
