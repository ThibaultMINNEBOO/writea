const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function countWords(markdown: string): number {
  return markdown.match(WORD)?.length ?? 0;
}

export function normalizeWord(word: string): string {
  return word.trim().toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");
}

/** Fast, synchronous fingerprint (cyrb53) used to detect concurrent edits, not for security. */
export function contentFingerprint(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return `${hash.toString(16)}:${text.length}`;
}
