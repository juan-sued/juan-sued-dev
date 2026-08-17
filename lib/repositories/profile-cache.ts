import { unstable_cache } from "next/cache";
import { getProfile } from "@/lib/repositories/profile";

export const PORTFOLIO_PROFILE_TAG = "portfolio:profile";

export function getCachedProfile(): Promise<Awaited<ReturnType<typeof getProfile>>> {
  return unstable_cache(
    async () => getProfile(),
    ["site-profile"],
    { tags: [PORTFOLIO_PROFILE_TAG], revalidate: 3600 },
  )();
}
