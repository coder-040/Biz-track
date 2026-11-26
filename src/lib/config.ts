function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function supabaseUrl(name: string, value: string | undefined): string {
  const raw = required(name, value);
  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error(
      `${name} must be the project API origin only (for example ` +
        `https://<project-ref>.supabase.co). Do not include /rest/v1 or a dashboard path.`,
    );
  }

  return parsed.origin;
}

export const SUPABASE_URL = supabaseUrl(
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
