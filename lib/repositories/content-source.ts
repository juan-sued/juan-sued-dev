export type ContentSource = "code" | "database";

export function getContentSource(value = process.env.CMS_CONTENT_SOURCE): ContentSource {
  return value === "database" ? "database" : "code";
}
