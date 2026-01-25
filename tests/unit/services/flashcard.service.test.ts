import { describe, it, expect, beforeEach } from 'vitest';
import { setupMSW, server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// Import service to test
// import { flashcardService } from '@/lib/services/flashcard.service';

// Setup MSW for all tests in this file
setupMSW();

describe('Flashcard Service', () => {
  beforeEach(() => {
    // Reset any runtime request handlers we may have added during tests
    server.resetHandlers();
  });

  describe('getFlashcards', () => {
    it('should fetch flashcards successfully', async () => {
      // Arrange
      const mockFlashcards = [
        {
          id: '1',
          question: 'What is TypeScript?',
          answer: 'A typed superset of JavaScript',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          question: 'What is React?',
          answer: 'A JavaScript library for building UIs',
          created_at: new Date().toISOString(),
        },
      ];

      server.use(
        http.get('/api/flashcards', () => {
          return HttpResponse.json({
            data: mockFlashcards,
            total: 2,
            page: 1,
            limit: 10,
          });
        })
      );

      // Act
      // const result = await flashcardService.getFlashcards({ page: 1, limit: 10 });

      // Assert
      // expect(result.data).toHaveLength(2);
      // expect(result.total).toBe(2);
      // expect(result.data[0].question).toBe('What is TypeScript?');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      server.use(
        http.get('/api/flashcards', () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: 'Internal Server Error',
          });
        })
      );

      // Act & Assert
      // await expect(
      //   flashcardService.getFlashcards({ page: 1, limit: 10 })
      // ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // Arrange
      server.use(
        http.get('/api/flashcards', () => {
          return HttpResponse.error();
        })
      );

      // Act & Assert
      // await expect(
      //   flashcardService.getFlashcards({ page: 1, limit: 10 })
      // ).rejects.toThrow();
    });
  });

  describe('createFlashcard', () => {
    it('should create a flashcard successfully', async () => {
      // Arrange
      const newFlashcard = {
        question: 'What is Vitest?',
        answer: 'A fast unit test framework',
      };

      server.use(
        http.post('/api/flashcards', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json(
            {
              data: {
                id: '3',
                ...body,
                created_at: new Date().toISOString(),
              },
            },
            { status: 201 }
          );
        })
      );

      // Act
      // const result = await flashcardService.createFlashcard(newFlashcard);

      // Assert
      // expect(result.data.id).toBe('3');
      // expect(result.data.question).toBe(newFlashcard.question);
      // expect(result.data.answer).toBe(newFlashcard.answer);
    });

    it('should handle validation errors', async () => {
      // Arrange
      server.use(
        http.post('/api/flashcards', () => {
          return HttpResponse.json(
            {
              error: 'Validation failed',
              details: {
                question: 'Question is required',
              },
            },
            { status: 400 }
          );
        })
      );

      // Act & Assert
      // await expect(
      //   flashcardService.createFlashcard({ question: '', answer: '' })
      // ).rejects.toThrow();
    });
  });
});
