import { getResumeUrls } from "@/lib/repositories/resumes";

export function getCachedResumeUrls(): ReturnType<typeof getResumeUrls> {
  return getResumeUrls();
}
