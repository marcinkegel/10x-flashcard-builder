import type { APIRoute } from 'astro';
import { createSupabaseAdminInstance } from '@/db/supabase.client';

export const POST: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  // 1. Verify user is logged in and get their ID
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Nieautoryzowany dostęp" }), {
      status: 401,
    });
  }

  const userId = user.id;

  // 2. Use Admin instance to delete user data and the user
  const supabaseAdmin = createSupabaseAdminInstance();
  
  // Explicitly delete user data first to ensure GDPR compliance if cascades fail
  // We do this in parallel for better performance
  const [flashcardsDelete, generationsDelete, logsDelete] = await Promise.all([
    supabaseAdmin.from('flashcards').delete().eq('user_id', userId),
    supabaseAdmin.from('generations').delete().eq('user_id', userId),
    supabaseAdmin.from('generation_error_logs').delete().eq('user_id', userId),
  ]);

  if (flashcardsDelete.error || generationsDelete.error || logsDelete.error) {
    console.error("Error deleting user data:", { 
      flashcards: flashcardsDelete.error, 
      generations: generationsDelete.error,
      logs: logsDelete.error 
    });
    // We continue anyway to try and delete the user account
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error("Error deleting user account:", deleteError);
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas usuwania konta" }), {
      status: 500,
    });
  }

  // 3. Sign out to clear cookies
  await supabase.auth.signOut();

  return new Response(JSON.stringify({ message: "Konto zostało usunięte" }), {
    status: 200,
  });
};
