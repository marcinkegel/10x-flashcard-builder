import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  const { password } = await request.json();

  if (!password) {
    return new Response(JSON.stringify({ error: "Hasło jest wymagane" }), {
      status: 400,
    });
  }

  const supabase = locals.supabase;

  // IMPORTANT: Verify user is logged in
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Nieautoryzowany dostęp" }), {
      status: 401,
    });
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ message: "Hasło zostało zaktualizowane" }), {
    status: 200,
  });
};
