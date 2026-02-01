# Testing Quick Reference

Quick reference for common testing patterns in this project.

## 🧪 Unit Testing Patterns

### Basic Test Structure

```typescript
import { describe, it, expect } from "vitest";

describe("Feature/Component Name", () => {
  it("should do something", () => {
    // Arrange
    const input = "test";

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe("expected");
  });
});
```

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

it('should handle user interaction', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button'));

  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### Mocking Functions

```typescript
import { vi } from "vitest";

// Create mock function
const mockFn = vi.fn();

// Mock return value
mockFn.mockReturnValue("value");

// Mock async return
mockFn.mockResolvedValue("async value");

// Assertions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith("arg");
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Mocking Modules

```typescript
vi.mock("@/lib/services/api", () => ({
  fetchData: vi.fn().mockResolvedValue({ data: [] }),
  postData: vi.fn(),
}));
```

### Using MSW for API Mocking

```typescript
import { setupMSW, server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

setupMSW();

it("should fetch data from API", async () => {
  server.use(
    http.get("/api/endpoint", () => {
      return HttpResponse.json({ data: "mocked" });
    })
  );

  // Test code that calls the API
});
```

### Common Assertions

```typescript
// Equality
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toStrictEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeLessThan(10);
expect(number).toBeCloseTo(0.3, 5);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain("substring");

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(5);

// Objects
expect(object).toHaveProperty("key");
expect(object).toMatchObject({ key: "value" });

// Functions
expect(fn).toThrow();
expect(fn).toThrow("error message");

// Testing Library
expect(element).toBeInTheDocument();
expect(element).toHaveTextContent("text");
expect(element).toBeVisible();
expect(element).toBeDisabled();
```

## 🎭 E2E Testing Patterns

### Basic E2E Test

```typescript
import { test, expect } from "@playwright/test";

test("should complete user flow", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Start");
  await expect(page).toHaveURL(/.*result/);
});
```

### Form Interactions

```typescript
test("should submit form", async ({ page }) => {
  await page.goto("/form");

  await page.fill('input[name="email"]', "user@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');

  await expect(page.locator(".success-message")).toBeVisible();
});
```

### Using Page Objects

```typescript
import { LoginPage } from "./pages/LoginPage";

test("should login", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login("user@example.com", "password");
  await loginPage.waitForNavigation();

  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Common Locators

```typescript
// By role (preferred)
page.getByRole("button", { name: "Submit" });
page.getByRole("textbox", { name: "Email" });
page.getByRole("link", { name: "Home" });

// By label
page.getByLabel("Email address");

// By placeholder
page.getByPlaceholder("Enter email");

// By text
page.getByText("Welcome");

// By test ID
page.getByTestId("submit-button");

// CSS selectors (fallback)
page.locator('button[type="submit"]');
page.locator(".btn-primary");
```

### Waiting and Assertions

```typescript
// Wait for element
await page.waitForSelector(".loader", { state: "hidden" });

// Wait for navigation
await page.waitForURL("**/dashboard");

// Expect element state
await expect(page.locator(".message")).toBeVisible();
await expect(page.locator(".message")).toHaveText("Success");
await expect(page.locator(".message")).toContainText("partial");

// Expect page
await expect(page).toHaveTitle(/Title/);
await expect(page).toHaveURL(/.*login/);

// Screenshots
await expect(page).toHaveScreenshot("homepage.png");
```

### API Testing with Playwright

```typescript
test("should call API endpoint", async ({ request }) => {
  const response = await request.get("/api/flashcards");

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data).toHaveProperty("flashcards");
});
```

## 🔧 Setup and Teardown

### Vitest Hooks

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";

beforeAll(() => {
  // Runs once before all tests in this file
});

afterAll(() => {
  // Runs once after all tests in this file
});

beforeEach(() => {
  // Runs before each test
});

afterEach(() => {
  // Runs after each test
  // cleanup() is automatically called by setup.ts
});
```

### Playwright Hooks

```typescript
import { test } from "@playwright/test";

test.beforeAll(async () => {
  // Runs once before all tests
});

test.afterAll(async () => {
  // Runs once after all tests
});

test.beforeEach(async ({ page }) => {
  // Runs before each test
  await page.goto("/");
});

test.afterEach(async ({ page }) => {
  // Runs after each test
  await page.close();
});
```

## 🎯 Quick Commands

```bash
# Unit tests
npm run test                    # Run once
npm run test:watch              # Watch mode
npm run test:ui                 # Open UI
npm run test:coverage           # Coverage report
npm run test -- example.test    # Run specific file

# E2E tests
npm run test:e2e                # Run all E2E tests
npm run test:e2e:ui             # Interactive mode
npm run test:e2e:report         # View report
npx playwright codegen          # Generate tests
npm run test:e2e -- --debug     # Debug mode
npx playwright show-trace       # View trace
```

## 📋 Checklist for New Tests

### Unit Test Checklist

- [ ] Test file ends with `.test.ts` or `.spec.ts`
- [ ] Tests are isolated and independent
- [ ] External dependencies are mocked
- [ ] Follows AAA pattern (Arrange, Act, Assert)
- [ ] Descriptive test names
- [ ] Edge cases covered
- [ ] Error cases tested

### E2E Test Checklist

- [ ] Test file ends with `.spec.ts`
- [ ] Tests are independent
- [ ] Uses semantic locators
- [ ] Waits for elements properly
- [ ] Cleans up after test
- [ ] Tests critical user journeys
- [ ] Screenshots for important states
