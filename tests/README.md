# Test Files

This directory contains test setup and utility files.

## Structure

- `setup.ts` - Global test setup for Vitest, including Testing Library matchers and browser API mocks
- `unit/` - Unit test examples and helpers
- `e2e/` - End-to-end tests using Playwright

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Open Playwright report
npm run test:e2e:report
```
