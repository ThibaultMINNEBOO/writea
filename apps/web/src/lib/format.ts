const numberFormat = new Intl.NumberFormat("fr-FR");
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });
const relativeFormat = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

export const formatNumber = (value: number) => numberFormat.format(value);

export const formatDate = (value: string | Date) => dateFormat.format(new Date(value));

export function formatRelative(value: string | Date) {
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return "à l'instant";
}

export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${formatNumber(count)} ${count > 1 ? plural : singular}`;
