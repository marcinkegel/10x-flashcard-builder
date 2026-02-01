/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Global setup - runs once before all tests start
 * Records the test run start time so teardown can delete only flashcards created during tests
 */
async function globalSetup() {
  const teardownEnabled = process.env.E2E_TEARDOWN === "true";

  console.log("\n🚀 Running global setup...");
  console.log(`   Teardown: ${teardownEnabled ? "✅ ENABLED" : "❌ DISABLED"}`);

  if (!teardownEnabled) {
    console.log("   ⚠️  Test data will NOT be cleaned up after tests");
    console.log("   💡 To enable cleanup: E2E_TEARDOWN=true npm run test:e2e\n");
    return; // Skip timestamp file creation
  }

  // Record test start time
  const testStartTime = new Date().toISOString();

  // Get directory path in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Save to a file that teardown can read
  const timestampFile = path.join(__dirname, ".test-start-time.json");
  fs.writeFileSync(timestampFile, JSON.stringify({ startTime: testStartTime }), "utf-8");

  console.log(`   ✅ Test run started at: ${testStartTime}`);
  console.log("   📝 Only flashcards created after this time will be deleted in teardown\n");
}

export default globalSetup;
