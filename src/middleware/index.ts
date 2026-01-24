import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '../db/supabase.client';

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
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // IMPORTANT: Always get user session first before any other operations
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isPublicPath = PUBLIC_PATHS.some(path => url.pathname.startsWith(path));

    // Handle root path redirect
    if (url.pathname === "/") {
      if (user) {
        return redirect('/generate');
      } else {
        return redirect('/login');
      }
    }

    if (user) {
      locals.user = {
        email: user.email!,
        id: user.id,
      };

      // If user is logged in and tries to access auth pages, redirect to dashboard
      if (isPublicPath && !url.pathname.startsWith('/api/')) {
        return redirect('/generate');
      }
    } else if (!isPublicPath) {
      // Redirect to login for protected routes
      return redirect('/login');
    }

    return next();
  },
);



