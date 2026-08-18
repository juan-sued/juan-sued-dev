import { unstable_cache } from "next/cache";
import { getResumeUrls } from "@/lib/repositories/resumes";

export const PORTFOLIO_RESUMES_TAG = "portfolio:resumes";

export function getCachedResumeUrls(): Promise<Awaited<ReturnType<typeof getResumeUrls>>> {
  return unstable_cache(
    async () => getResumeUrls(),
    ["resumes", "published"],
    { tags: [PORTFOLIO_RESUMES_TAG], revalidate: 3600 },
  )();
}
