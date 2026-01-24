import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, locals, redirect, cookies }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/generate';

  if (code) {
    const supabase = locals.supabase;
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect(next);
    }
  }

  // Return the user to an error page with instructions
  return redirect('/login?error=Wystąpił błąd podczas autentykacji');
};
