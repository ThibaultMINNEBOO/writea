const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function countWords(markdown: string): number {
  return markdown.match(WORD)?.length ?? 0;
}

export function normalizeWord(word: string): string {
  return word.trim().toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");
}
