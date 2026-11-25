function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = required(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const BUSINESS_ID = required(
  "NEXT_PUBLIC_BIZTRACK_BUSINESS_ID",
  process.env.NEXT_PUBLIC_BIZTRACK_BUSINESS_ID,
);

export const ACTOR_ID = required(
  "NEXT_PUBLIC_BIZTRACK_ACTOR_ID",
  process.env.NEXT_PUBLIC_BIZTRACK_ACTOR_ID,
);

export const ACTOR_NAME =
  process.env.NEXT_PUBLIC_BIZTRACK_ACTOR_NAME?.trim() || null;
