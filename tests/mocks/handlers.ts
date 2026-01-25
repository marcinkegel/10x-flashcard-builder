import { http, HttpResponse } from 'msw';

/**
 * Mock handlers for browser environment
 * Use with setupWorker() for browser-based development
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

  http.post('/api/flashcards', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        data: {
          id: Math.random().toString(36).substring(7),
          ...body,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  // Example: Mock generations API
  http.post('/api/generations', () => {
    return HttpResponse.json({
      data: {
        session_id: 'session-123',
        status: 'completed',
        flashcards: [
          {
            question: 'What is AI?',
            answer: 'Artificial Intelligence',
          },
          {
            question: 'What is ML?',
            answer: 'Machine Learning',
          },
        ],
      },
    });
  }),
];
