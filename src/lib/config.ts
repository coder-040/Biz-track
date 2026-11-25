export const DEMO_BUSINESS_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_ACTOR_ID = "22222222-2222-4222-8222-222222222222";

function supabaseOrigin(raw: string | undefined): string {
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return raw;
  }
}

export const SUPABASE_URL = supabaseOrigin(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
);

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export const BUSINESS_ID =
  process.env.NEXT_PUBLIC_BIZTRACK_BUSINESS_ID?.trim() || DEMO_BUSINESS_ID;

export const ACTOR_ID =
  process.env.NEXT_PUBLIC_BIZTRACK_ACTOR_ID?.trim() || DEMO_ACTOR_ID;

export const ACTOR_NAME =
  process.env.NEXT_PUBLIC_BIZTRACK_ACTOR_NAME?.trim() || null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = SUPABASE_URL;
  const anonKey = SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export type DataSource = "supabase" | "demo";

export function getDataSource(): DataSource {
  return isSupabaseConfigured() ? "supabase" : "demo";
}
