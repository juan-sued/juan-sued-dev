import { z } from "zod";

export const contentSourceSchema = z.enum(["code", "database"]);
export type ContentSource = z.infer<typeof contentSourceSchema>;

export function getContentSource(value = process.env.CMS_CONTENT_SOURCE): ContentSource {
  return contentSourceSchema.catch("code").parse(value);
}
