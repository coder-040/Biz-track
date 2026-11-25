export const DEMO_BUSINESS_ID = "11111111-1111-4111-8111-111111111111";

export const BUSINESS_ID =
  process.env.NEXT_PUBLIC_BIZTRACK_BUSINESS_ID?.trim() || DEMO_BUSINESS_ID;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

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
