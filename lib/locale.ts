export type Locale = "pt" | "en";
export type Copy = Record<Locale, string>;
export const text = (value: Copy, locale: Locale) => value[locale];
