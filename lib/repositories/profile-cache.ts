import { getProfile } from "@/lib/repositories/profile";

export function getCachedProfile(): ReturnType<typeof getProfile> {
  return getProfile();
}
