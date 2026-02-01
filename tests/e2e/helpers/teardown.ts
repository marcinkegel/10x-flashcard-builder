/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Clean up flashcards created during the current test run.
 * This is used for teardown in E2E tests.
 *
 * Only deletes flashcards created AFTER the test run started (recorded in global setup).
 * This preserves any pre-existing flashcards on the test user account.
 *
 * Uses Supabase client with user credentials to delete flashcards.
 */
export async function cleanupFlashcards() {
  if (process.env.E2E_TEARDOWN !== "true") {
    // Don't log here - already logged in global-teardown.ts
    return;
  }

  console.log("   📋 Starting flashcard cleanup...");

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const userEmail = process.env.E2E_USERNAME;
    const userPassword = process.env.E2E_PASSWORD;

    if (!supabaseUrl || !supabaseKey || !userEmail || !userPassword) {
      console.error("Missing environment variables for teardown");
      return;
    }

    // Get directory path in ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Read test start time from file created in global setup
    const timestampFile = path.join(__dirname, "..", ".test-start-time.json");
    let testStartTime: string | null = null;

    if (fs.existsSync(timestampFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(timestampFile, "utf-8"));
        testStartTime = data.startTime;
        console.log(`   ⏰ Test started at: ${testStartTime}`);
      } catch (error) {
        console.warn("   ⚠️  Could not read test start time, will delete all flashcards:", error);
      }
    } else {
      console.warn("   ⚠️  Test start time file not found, will delete all flashcards");
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Sign in as test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    });

    if (authError || !authData.session) {
      console.error("Failed to authenticate for teardown:", authError);
      return;
    }

    // Build query to fetch flashcards
    let query = supabase.from("flashcards").select("id, created_at").eq("user_id", authData.user.id);

    // Only delete flashcards created during this test run
    if (testStartTime) {
      query = query.gte("created_at", testStartTime);
    }

    const { data: flashcards, error: fetchError } = await query.limit(100);

    if (fetchError) {
      console.error("Failed to fetch flashcards:", fetchError);
      return;
    }

    if (!flashcards || flashcards.length === 0) {
      console.log("   ✓ No flashcards found to delete");

      // Cleanup timestamp file
      if (fs.existsSync(timestampFile)) {
        fs.unlinkSync(timestampFile);
      }

      return;
    }

    console.log(`   🗑️  Deleting ${flashcards.length} flashcard(s)...`);

    // Delete flashcards by building query
    let deleteQuery = supabase.from("flashcards").delete().eq("user_id", authData.user.id);

    // Only delete flashcards created during this test run
    if (testStartTime) {
      deleteQuery = deleteQuery.gte("created_at", testStartTime);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error("   ❌ Failed to delete flashcards:", deleteError);
      return;
    }

    console.log(`   ✅ Deleted ${flashcards.length} flashcard(s)`);
    if (testStartTime) {
      console.log("   💾 Pre-existing flashcards were preserved");
    }

    // Cleanup timestamp file
    if (fs.existsSync(timestampFile)) {
      fs.unlinkSync(timestampFile);
    }

    // Sign out
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error during teardown:", error);
  }
}
