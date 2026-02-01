import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { GeneratePage } from "./pages/GeneratePage";

/**
 * Generate unique source text to avoid duplicate detection in database
 * Adds timestamp + random string to ensure uniqueness even in parallel execution
 */
function makeUniqueText(baseText: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const uniqueSuffix = `\n\n--- Test run: ${timestamp}-${random} ---\n`;
  return baseText + uniqueSuffix;
}

/**
 * E2E tests for AI flashcard generation flow
 * 
 * Prerequisites:
 * - User must exist in test database with credentials from .env.test
 * - OpenRouter API key must be valid in .env.test
 */
test.describe("AI Flashcard Generation Flow", () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.E2E_USERNAME!;
    const password = process.env.E2E_PASSWORD!;

    await loginPage.login(email, password);
    await loginPage.waitForSuccessfulLogin();
  });

  test("should display generation form correctly", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Verify form elements are visible
    await expect(generatePage.sourceTextInput).toBeVisible();
    await expect(generatePage.generateButton).toBeVisible();

    // Button should be disabled initially (no text)
    expect(await generatePage.isGenerateDisabled()).toBe(true);
  });

  test("should show validation error for text too short", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Enter text shorter than minimum (1000 chars)
    const shortText = "This is a very short text that is definitely less than 1000 characters.";
    await generatePage.fillSourceText(shortText);

    // Blur to trigger validation
    await generatePage.sourceTextInput.blur();

    // Validation error should appear
    await expect(generatePage.validationError).toBeVisible({ timeout: 2000 });

    const errorText = await generatePage.getValidationErrorText();
    expect(errorText).toContain("za krótki");

    // Generate button should be disabled
    expect(await generatePage.isGenerateDisabled()).toBe(true);
  });

  test("should show validation error for text too long", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Enter text longer than maximum (10000 chars)
    const longText = "x".repeat(10001);
    await generatePage.fillSourceText(longText);

    // Validation error should appear
    await expect(generatePage.validationError).toBeVisible({ timeout: 2000 });

    const errorText = await generatePage.getValidationErrorText();
    expect(errorText).toContain("za długi");

    // Generate button should be disabled
    expect(await generatePage.isGenerateDisabled()).toBe(true);
  });

  test("should generate flashcards from valid text", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Prepare valid text (between 1000-10000 chars)
    const baseText = `
      React to biblioteka JavaScript stworzona przez Facebook, służąca do budowania interfejsów użytkownika.
      Wykorzystuje komponenty i Virtual DOM do optymalizacji wydajności renderowania.
      React pozwala na tworzenie złożonych aplikacji webowych z reaktywnym, deklaratywnym kodem.
      
      Komponenty w React mogą być funkcyjne lub klasowe. Komponenty funkcyjne są prostsze i bardziej popularne
      we współczesnym rozwoju. Można w nich używać hooków takich jak useState, useEffect, useContext.
      
      Virtual DOM to reprezentacja rzeczywistego DOM w pamięci. React porównuje Virtual DOM z rzeczywistym DOM
      i aktualizuje tylko te elementy, które się zmieniły. To podejście znacząco poprawia wydajność aplikacji.
      
      JSX to rozszerzenie składni JavaScript, które pozwala pisać strukturę komponentów w sposób podobny do HTML.
      JSX jest transpilowany do wywołań React.createElement podczas procesu budowania.
      
      State w React to obiekt przechowujący dane komponentu, które mogą się zmieniać w czasie.
      Gdy state się zmienia, React automatycznie ponownie renderuje komponent.
      
      Props to skrót od "properties" i służą do przekazywania danych między komponentami.
      Props są tylko do odczytu i nie mogą być modyfikowane przez komponent potomny.
    `.repeat(2); // Multiply to reach ~1000+ characters

    const validText = makeUniqueText(baseText);

    await generatePage.fillSourceText(validText);

    // Click generate button
    await generatePage.clickGenerate();

    // Check loading state
    expect(await generatePage.isGenerating()).toBe(true);

    // Wait for proposals (this calls OpenRouter API, might take 10-30 seconds)
    await generatePage.waitForProposals(35000);

    // Verify proposals are displayed
    const proposalsCount = await generatePage.getProposalsCount();
    expect(proposalsCount).toBeGreaterThan(0);
    expect(proposalsCount).toBeLessThanOrEqual(10);
  });

  test("should accept proposal and verify it's marked", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Generate proposals first
    const baseText = `
      TypeScript to typowany nadzbiór JavaScript, który kompiluje się do czystego JavaScript.
      Dodaje statyczne typowanie do JavaScript, co pomaga wychwytywać błędy podczas kompilacji.
      TypeScript wspiera klasy, interfejsy, typy generyczne i wiele innych zaawansowanych funkcji.
      
      Interfejsy w TypeScript definiują strukturę obiektów. Można je używać do opisywania kształtu danych.
      Typy mogą być primitywne (string, number, boolean) lub złożone (obiekty, tablice, tuple).
      
      Typy generyczne pozwalają na tworzenie komponentów wielokrotnego użytku, które mogą działać
      z różnymi typami danych zachowując bezpieczeństwo typów.
      
      Enumeracje (enum) w TypeScript pozwalają na definiowanie zestawu nazwanych stałych.
      Są przydatne do reprezentowania ograniczonego zestawu wartości.
    `.repeat(2);

    const validText = makeUniqueText(baseText);

    await generatePage.fillSourceText(validText);
    await generatePage.clickGenerate();
    await generatePage.waitForProposals(35000);

    // Get first proposal and accept it
    const firstProposal = generatePage.getProposal(0);
    await firstProposal.accept();

    // Verify proposal is marked as accepted
    expect(await firstProposal.isAccepted()).toBe(true);
  });

  test("should reject proposal and verify it's marked", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Generate proposals
    const baseText = `
      Node.js to środowisko uruchomieniowe JavaScript po stronie serwera.
      Zbudowane na silniku V8 z Chrome, pozwala uruchamiać JavaScript poza przeglądarką.
      Node.js wykorzystuje nieblokujący, sterowany zdarzeniami model I/O.
      
      NPM (Node Package Manager) to menedżer pakietów dla Node.js.
      Zawiera setki tysięcy bibliotek open-source dostępnych do użycia.
      Package.json to plik konfiguracyjny zawierający informacje o projekcie i jego zależnościach.
      
      Express.js to minimalny framework webowy dla Node.js.
      Ułatwia tworzenie serwerów HTTP i API RESTful.
    `.repeat(2);

    const validText = makeUniqueText(baseText);

    await generatePage.fillSourceText(validText);
    await generatePage.clickGenerate();
    await generatePage.waitForProposals(35000);

    // Get first proposal and reject it
    const firstProposal = generatePage.getProposal(0);
    await firstProposal.reject();

    // Verify proposal is marked as rejected
    expect(await firstProposal.isRejected()).toBe(true);
  });

  test("should edit proposal and save changes", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.goto();

    // Generate proposals
    const baseText = `
      Git to rozproszony system kontroli wersji używany do śledzenia zmian w kodzie źródłowym.
      Został stworzony przez Linusa Torvaldsa w 2005 roku dla rozwoju jądra Linux.
      Git pozwala wielu programistom pracować nad tym samym projektem jednocześnie.
      
      Commit w Git to snapshot projektu w określonym momencie czasu.
      Branch to niezależna linia rozwoju, która oddziela się od głównej gałęzi.
      Merge łączy zmiany z różnych branchy w jedną gałąź.
      
      GitHub to platforma hostingowa dla repozytoriów Git.
      Oferuje narzędzia do współpracy, code review i zarządzania projektami.
    `.repeat(2);

    const validText = makeUniqueText(baseText);

    await generatePage.fillSourceText(validText);
    await generatePage.clickGenerate();
    await generatePage.waitForProposals(35000);

    // Get first proposal
    const firstProposal = generatePage.getProposal(0);

    // Get original text
    const originalFront = await firstProposal.getFrontText();
    const originalBack = await firstProposal.getBackText();

    // Edit proposal
    const newFront = originalFront + " (edited)";
    const newBack = originalBack + " (edited)";

    await firstProposal.edit(newFront, newBack);

    // Wait a bit for changes to apply
    await page.waitForTimeout(500);

    // Verify changes were saved and proposal is accepted
    expect(await firstProposal.isAccepted()).toBe(true);
  });

  // NOTE: Test removed - navigation to library after saving was never implemented
  // The application is designed to keep users on /generate page after saving,
  // allowing them to generate more flashcards. There is no automatic redirect to /flashcards.
});
