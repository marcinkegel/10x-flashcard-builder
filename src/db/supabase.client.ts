import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// For non-SSR contexts - only works in local dev, not in Cloudflare
// In production, always use createSupabaseServerInstance with runtime context
const getEnv = (key: string) => {
  // Try import.meta.env (build time)
  if (import.meta.env[key]) return import.meta.env[key];
  // Try process.env (runtime with nodejs_compat)
  if (typeof process !== "undefined" && process.env?.[key]) return process.env[key];
  return undefined;
};

const defaultUrl = getEnv("SUPABASE_URL");
const defaultKey = getEnv("SUPABASE_KEY");

export const supabaseClient = defaultUrl && defaultKey ? createClient<Database>(defaultUrl, defaultKey) : null;

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

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  // In Cloudflare Pages, environment variables are injected at build time into import.meta.env
  // They are set in Cloudflare Dashboard and available during deployment
  // Fallback to process.env for runtime access with nodejs_compat
  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseKey = getEnv("SUPABASE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_KEY must be set in Cloudflare Pages Dashboard " +
        "(Settings > Environment variables > Production). " +
        `Current URL: ${supabaseUrl ? "set" : "not set"}, Key: ${supabaseKey ? "set" : "not set"}`
    );
  }

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

export const createSupabaseAdminInstance = () => {
  // In Cloudflare Pages, environment variables are injected at build time
  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Cloudflare Pages Dashboard " +
        "(Settings > Environment variables > Production)"
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
