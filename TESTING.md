# Testing Guide

This project uses **Vitest** for unit and integration tests and **Playwright** for end-to-end (E2E) tests.

## Table of Contents

- [Quick Start](#quick-start)
- [Unit Testing with Vitest](#unit-testing-with-vitest)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

---

## Quick Start

### Install Dependencies

All testing dependencies are already included in the project:

```bash
npm install
```

### Run Tests

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# Unit tests with UI
npm run test:ui

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# View E2E test report
npm run test:e2e:report
```

---

## Unit Testing with Vitest

### Configuration

The Vitest configuration is in `vitest.config.ts`:

- **Environment**: `happy-dom` (lightweight DOM implementation)
- **Setup files**: `tests/setup.ts` (global mocks and matchers)
- **Coverage**: V8 provider with thresholds at 60%

### Writing Unit Tests

Create test files with `.test.ts` or `.spec.ts` extension in the `src/` directory or `tests/unit/`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<MyComponent onClick={handleClick} />);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Best Practices for Unit Tests

1. **Use descriptive test names**: Clearly state what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Mock external dependencies**: Use `vi.mock()` for modules
4. **Test user interactions**: Use `@testing-library/user-event`
5. **Leverage snapshots**: Use inline snapshots for readable assertions
6. **Watch mode**: Run `npm run test:watch` during development

### Mocking Examples

#### Mock a module

```typescript
vi.mock("@/lib/services/flashcard.service", () => ({
  getFlashcards: vi.fn().mockResolvedValue([]),
  createFlashcard: vi.fn().mockResolvedValue({ id: "1" }),
}));
```

#### Mock a function

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue("mocked value");
mockFn.mockResolvedValue(Promise.resolve("async value"));
```

#### Spy on existing functions

```typescript
const spy = vi.spyOn(console, "error").mockImplementation(() => {});
// ... test code ...
expect(spy).toHaveBeenCalled();
spy.mockRestore();
```

---

## E2E Testing with Playwright

### Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: `http://localhost:4321`
- **Auto-start dev server**: Yes
- **Trace**: On first retry
- **Screenshots**: On failure

### Writing E2E Tests

Create test files with `.spec.ts` extension in `tests/e2e/`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should perform action", async ({ page }) => {
    await page.goto("/");

    await page.click("text=Login");
    await expect(page).toHaveURL(/.*login/);

    await page.fill('input[type="email"]', "user@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*flashcards/);
  });
});
```

### Page Object Model

Use the Page Object Model (POM) pattern for maintainable tests:

```typescript
// tests/e2e/pages/LoginPage.ts
import { Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  get emailInput() {
    return this.page.locator('input[type="email"]');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.page.locator('input[type="password"]').fill(password);
    await this.page.click('button[type="submit"]');
  }
}

// Usage in test
import { LoginPage } from "./pages/LoginPage";

test("login flow", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto("/login");
  await loginPage.login("user@example.com", "password123");
});
```

### Best Practices for E2E Tests

1. **Use Page Object Model**: Encapsulate page interactions
2. **Use semantic locators**: Prefer `role`, `label`, `text` over CSS selectors
3. **Wait for actions to complete**: Use `expect` with auto-waiting
4. **Isolate tests**: Each test should be independent
5. **Use browser contexts**: For isolated test environments
6. **Record tests**: Use `npx playwright codegen` to generate test code
7. **Debug with trace viewer**: `npx playwright show-trace trace.zip`

### Playwright Commands

```bash
# Generate tests interactively
npx playwright codegen http://localhost:4321

# Run specific test file
npx playwright test tests/e2e/login.spec.ts

# Run tests in headed mode
npx playwright test --headed

# Debug tests
npx playwright test --debug

# View test report
npx playwright show-report
```

---

## Best Practices

### General Testing Principles

1. **Write tests that mimic user behavior**: Test from the user's perspective
2. **Keep tests simple and focused**: One assertion per test when possible
3. **Avoid testing implementation details**: Test behavior, not implementation
4. **Use meaningful test descriptions**: Make tests self-documenting
5. **Maintain test independence**: Tests should not depend on each other
6. **Clean up after tests**: Use `afterEach` hooks to reset state

### Test Organization

```
tests/
├── setup.ts                 # Global Vitest setup
├── unit/                    # Unit test examples
│   └── example.test.tsx
├── e2e/                     # E2E tests
│   ├── pages/               # Page Object Models
│   │   └── LoginPage.ts
│   └── example.spec.ts
└── README.md
```

### Coverage Goals

- **Unit tests**: Aim for 60%+ coverage on business logic
- **E2E tests**: Cover critical user journeys
- **Integration tests**: Test service interactions

### When to Write Which Test

- **Unit tests**: Pure functions, utilities, hooks, isolated components
- **Integration tests**: Services with mocked APIs, component interactions
- **E2E tests**: Complete user flows, authentication, CRUD operations

---

## CI/CD Integration

Tests run automatically on:

- Push to `main`, `master`, or `develop` branches
- Pull requests to these branches

### GitHub Actions Workflow

The workflow in `.github/workflows/tests.yml`:

1. **Unit Tests Job**:
   - Runs Vitest tests
   - Generates coverage report
   - Uploads to Codecov

2. **E2E Tests Job**:
   - Installs Playwright browsers
   - Runs E2E tests
   - Uploads test artifacts

### Environment Variables for CI

Set these in GitHub repository secrets:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter (if needed for tests)
OPENROUTER_API_KEY=your_openrouter_api_key
```

---

## Troubleshooting

### Common Issues

#### Tests fail with module not found

```bash
# Make sure TypeScript paths are configured
# Check tsconfig.json and vitest.config.ts
```

#### Playwright tests timeout

```bash
# Increase timeout in playwright.config.ts
timeout: 60000 // 60 seconds
```

#### Coverage reports missing files

```bash
# Check coverage.include and coverage.exclude in vitest.config.ts
```

### Getting Help

- **Vitest docs**: https://vitest.dev
- **Playwright docs**: https://playwright.dev
- **Testing Library docs**: https://testing-library.com
- **Project issues**: Create an issue in the repository

---

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [MSW (Mock Service Worker)](https://mswjs.io)
