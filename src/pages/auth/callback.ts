import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/generate";

  // Security check: Ensure 'next' is a local path to prevent Open Redirect attacks
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/generate";

  if (code) {
    const supabase = locals.supabase;
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect(safeNext);
    }

    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // Handle errors from Supabase (e.g. error_description)
  const errorDescription = url.searchParams.get("error_description");
  if (errorDescription) {
    return redirect(`/login?error=${encodeURIComponent(errorDescription)}`);
  }

  return redirect("/login?error=Nieprawidłowy kod lub błąd autentykacji");
};
