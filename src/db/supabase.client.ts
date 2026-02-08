import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// Get environment variables from runtime (Cloudflare) or build-time (import.meta.env)
// In Cloudflare Workers, these will be undefined at module level, so we'll get them from context
const getEnvVar = (key: string, runtime?: Record<string, string>): string => {
  // Try runtime first (Cloudflare env binding)
  if (runtime && runtime[key]) {
    return runtime[key];
  }
  // Fallback to build-time env (for local dev)
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  throw new Error(`Environment variable ${key} is not defined`);
};

// For non-SSR contexts - only works in local dev, not in Cloudflare
// In production, always use createSupabaseServerInstance with runtime context
export const supabaseClient = import.meta.env.SUPABASE_URL
  ? createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY)
  : null;

export type SupabaseClient = NonNullable<typeof supabaseClient>;

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

export function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
  runtime?: Record<string, string>;
}) => {
  const supabaseUrl = getEnvVar("SUPABASE_URL", context.runtime);
  const supabaseKey = getEnvVar("SUPABASE_KEY", context.runtime);

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

export const createSupabaseAdminInstance = (runtime?: Record<string, string>) => {
  const supabaseUrl = getEnvVar("SUPABASE_URL", runtime);
  const supabaseServiceRoleKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY", runtime);

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
