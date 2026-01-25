import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const loginSchema = z.object({
  email: z.string().email("Niepoprawny format adresu e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: result.error.errors[0].message,
        }),
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const supabase = locals.supabase;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // PRD US-002: Błędne dane logowania skutkują wyświetleniem komunikatu o niepowodzeniu
      // bez zdradzania, które pole jest błędne.
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy e-mail lub hasło",
        }),
        { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { status: 200 }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas logowania. Spróbuj ponownie później.",
      }),
      { status: 500 }
    );
  }
};
