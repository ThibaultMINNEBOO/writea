const MARKUP = new Set(["*", "_", "`", "#", ">"]);
const SPACE = /[\s  ]/;
const QUOTES = new Set(['"', "«", "»", "“", "”"]);

type Normalized = { text: string; positions: number[] };

/**
 * Reduces text to what a reader sees: markdown markup dropped, whitespace collapsed and quotes
 * unified without surrounding spaces. `positions` maps every kept character to its source index.
 */
function normalize(source: string): Normalized {
  let text = "";
  const positions: number[] = [];
  let skipSpace = true;

  for (let index = 0; index < source.length; index++) {
    const char = source.charAt(index);
    if (MARKUP.has(char)) continue;
    if (SPACE.test(char)) {
      if (!skipSpace) {
        text += " ";
        positions.push(index);
        skipSpace = true;
      }
      continue;
    }
    if (QUOTES.has(char)) {
      if (text.endsWith(" ")) {
        text = text.slice(0, -1);
        positions.pop();
      }
      text += '"';
      positions.push(index);
      skipSpace = true;
      continue;
    }
    text += char === "’" ? "'" : char;
    positions.push(index);
    skipSpace = false;
  }
  return { text, positions };
}

export type TextRange = { from: number; to: number };

export function locateQuote(source: string, quote: string, hint = 0): TextRange | null {
  const needle = normalize(quote).text.trim();
  if (!needle) return null;
  const haystack = normalize(source);

  let best = -1;
  for (
    let index = haystack.text.indexOf(needle);
    index !== -1;
    index = haystack.text.indexOf(needle, index + 1)
  ) {
    if (best === -1 || Math.abs(index - hint) < Math.abs(best - hint)) best = index;
  }
  if (best === -1) return null;

  const from = haystack.positions[best];
  const last = haystack.positions[best + needle.length - 1];
  return from === undefined || last === undefined ? null : { from, to: last + 1 };
}
