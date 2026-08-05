export const contentTypes = ["experiences", "skills", "education"] as const;
export type ContentType = typeof contentTypes[number];

export function parseContentType(value: string): ContentType | null {
  return contentTypes.includes(value as ContentType) ? value as ContentType : null;
}
