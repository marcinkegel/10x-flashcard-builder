import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll } from 'vitest';

/**
 * Mock handlers for API endpoints
 * Add your API endpoint mocks here
 */
export const handlers = [
  // Example: Mock flashcards API
  http.get('/api/flashcards', () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          question: 'What is TypeScript?',
          answer: 'A typed superset of JavaScript',
          created_at: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });
  }),

  // Example: Mock OpenRouter API
  http.post('https://openrouter.ai/api/v1/chat/completions', () => {
    return HttpResponse.json({
      id: 'gen-123',
      choices: [
        {
          message: {
            role: 'assistant',
            content: JSON.stringify({
              flashcards: [
                {
                  question: 'What is AI?',
                  answer: 'Artificial Intelligence',
                },
              ],
            }),
          },
        },
      ],
    });
  }),
];

/**
 * Setup MSW server for testing
 */
export const server = setupServer(...handlers);

/**
 * Setup hooks for MSW
 * Call this in your test setup file or individual test files
 */
export function setupMSW() {
  // Start server before all tests
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });

  // Reset handlers after each test
  afterEach(() => {
    server.resetHandlers();
  });

  // Clean up after all tests
  afterAll(() => {
    server.close();
  });
}
