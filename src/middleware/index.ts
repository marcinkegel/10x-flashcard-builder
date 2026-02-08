import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";
import "../polyfills";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/update-password",
  "/auth/callback",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/update-password",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, request, redirect } = context;

  // Get runtime environment variables from Cloudflare binding
  // In Cloudflare Workers, env is available at runtime.env
  const runtime = (locals.runtime as { env?: Record<string, string> })?.env || {};

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
    runtime,
  });

  locals.supabase = supabase;
  // Store runtime for use in API routes
  locals.runtime = runtime;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname.startsWith(path));

  // Handle root path redirect
  if (url.pathname === "/") {
    if (user) {
      return redirect("/generate");
    } else {
      return redirect("/login");
    }
  }

  if (user) {
    locals.user = {
      email: user.email ?? "",
      id: user.id,
    };

    // If user is logged in and tries to access auth pages, redirect to dashboard
    if (isPublicPath && !url.pathname.startsWith("/api/")) {
      return redirect("/generate");
    }
  } else if (!isPublicPath) {
    // For API routes, return 401 instead of redirecting
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Redirect to login for protected web routes, keeping the original path
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("redirectTo", url.pathname);
    return redirect(loginUrl.toString());
  }

  return next();
});
