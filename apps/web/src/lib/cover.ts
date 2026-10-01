const covers = ["bg-cover-1", "bg-cover-2", "bg-cover-3", "bg-cover-4", "bg-cover-5"] as const;

export function coverClass(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return covers[hash % covers.length];
}

export function initials(text: string) {
  return text
    .split(/[\s'’-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase("fr"))
    .join("");
}
