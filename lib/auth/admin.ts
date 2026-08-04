import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function getAdmin() { const supabase = await createClient(); const { data } = await supabase.auth.getClaims(); const user = data?.claims; return user?.sub && user.sub === process.env.ADMIN_USER_ID ? { id: user.sub, email: typeof user.email === "string" ? user.email : "" } : null; }
export async function requireAdmin() { const supabase = await createClient(); const { data } = await supabase.auth.getClaims(); const user = data?.claims; if (!user?.sub) redirect("/admin/login"); if (user.sub !== process.env.ADMIN_USER_ID) { await supabase.auth.signOut(); redirect("/admin/forbidden"); } return { id: user.sub, email: typeof user.email === "string" ? user.email : "" }; }
