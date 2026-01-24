import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email jest wymagany" }), {
        status: 400,
      });
    }

    const supabase = locals.supabase;
    
    // Construct the redirect URL for the password reset link
    // The link will first go to /auth/callback to exchange the code for a session
    // and then redirect to /update-password
    const url = new URL(request.url);
    const redirectTo = `${url.origin}/auth/callback?next=/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: "Link do resetowania hasła został wysłany" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), {
      status: 500,
    });
  }
};
