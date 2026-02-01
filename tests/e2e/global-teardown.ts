/* eslint-disable no-console */
import { cleanupFlashcards } from "./helpers/teardown";

/**
 * Global teardown - runs once after all tests are complete
 * This ensures we don't interfere with parallel test execution
 */
async function globalTeardown() {
  const teardownEnabled = process.env.E2E_TEARDOWN === "true";

  console.log("\n🧹 Running global teardown step...");

  if (!teardownEnabled) {
    console.log("   ⏭️  SKIPPED - Teardown is disabled (E2E_TEARDOWN !== true)");
    console.log("   ℹ️  Test data was NOT cleaned up");
    console.log("   💡 To enable cleanup: E2E_TEARDOWN=true npm run test:e2e");
  } else {
    console.log("   🗑️  Cleaning up test data...");
    await cleanupFlashcards();
  }

  if (!teardownEnabled) {
    console.log("✅ Global teardown step complete without cleanup\n");
  } else {
    console.log("✅ Global teardown complete\n");
  }
}

export default globalTeardown;
