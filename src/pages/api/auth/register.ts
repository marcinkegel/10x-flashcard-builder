import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const prerender = false;

const registerSchema = z.object({
  email: z.string().email('Niepoprawny format adresu e-mail'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków'),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: result.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie później.',
      }),
      { status: 500 }
    );
  }
};
