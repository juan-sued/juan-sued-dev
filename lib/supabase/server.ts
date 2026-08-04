import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function createClient() { const store = await cookies(); return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll: () => store.getAll(), setAll: cookies => { try { cookies.forEach(cookie => store.set(cookie.name, cookie.value, cookie.options)); } catch {} } } }); }
