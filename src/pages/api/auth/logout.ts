import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(null, { status: 200 });
};
