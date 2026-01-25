import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenRouterService } from '../../../src/lib/services/openrouter.service';
import { setupMSW, server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

setupMSW();

// Stub OPENROUTER_API_KEY
vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key');

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OpenRouterService();
  });

  describe('generateChatCompletion', () => {
    it('should successfully return parsed JSON content', async () => {
      const mockData = { proposals: [{ front: 'Q', back: 'A' }] };
      
      server.use(
        http.post('https://openrouter.ai/api/v1/chat/completions', () => {
          return HttpResponse.json({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockData),
                },
              },
            ],
          });
        })
      );

      const result = await service.generateChatCompletion<{ proposals: any[] }>({
        systemPrompt: 'sys',
        userPrompt: 'user',
        responseSchema: {},
      });

      expect(result).toEqual(mockData);
    });

    it('should retry on 429 error and succeed', async () => {
      let attempts = 0;
      const mockData = { success: true };

      server.use(
        http.post('https://openrouter.ai/api/v1/chat/completions', () => {
          attempts++;
          if (attempts === 1) {
            return new HttpResponse(JSON.stringify({ error: { message: 'Rate limit' } }), { status: 429 });
          }
          return HttpResponse.json({
            choices: [{ message: { content: JSON.stringify(mockData) } }],
          });
        })
      );

      vi.useFakeTimers();
      
      const promise = service.generateChatCompletion({ 
        systemPrompt: 's', 
        userPrompt: 'u', 
        responseSchema: {} 
      });
      
      await vi.runAllTimersAsync();
      const result = await promise;
      
      expect(attempts).toBe(2);
      expect(result).toEqual(mockData);
      vi.useRealTimers();
    });

    it('should throw the original error after max retries are exceeded', async () => {
      server.use(
        http.post('https://openrouter.ai/api/v1/chat/completions', () => {
          return new HttpResponse(JSON.stringify({ error: { message: 'Rate limit' } }), { status: 429 });
        })
      );

      vi.useFakeTimers();
      const promise = service.generateChatCompletion({ 
        systemPrompt: 's', 
        userPrompt: 'u', 
        responseSchema: {} 
      });
      
      // Attach a no-op catch to prevent unhandled rejection warning in Node.js
      // as the rejection happens during runAllTimersAsync before expect() is reached.
      promise.catch(() => {});

      // Advance timers for all retries
      for(let i = 0; i < 4; i++) {
        await vi.runAllTimersAsync();
      }
      
      // The implementation throws the last caught error (429) rather than "Max retries exceeded"
      await expect(promise).rejects.toThrow(/429 Too Many Requests/);
      vi.useRealTimers();
    });

    it('should throw Validation Error when model returns invalid JSON', async () => {
      server.use(
        http.post('https://openrouter.ai/api/v1/chat/completions', () => {
          return HttpResponse.json({
            choices: [
              {
                message: {
                  content: 'Not a JSON',
                },
              },
            ],
          });
        })
      );

      await expect(service.generateChatCompletion({ 
        systemPrompt: 's', 
        userPrompt: 'u', 
        responseSchema: {} 
      })).rejects.toThrow(/Validation Error/);
    });

    it('should handle specialized error codes correctly', async () => {
       const testCases = [
         { status: 401, expected: /401 Unauthorized/ },
         { status: 402, expected: /402 Payment Required/ },
         { status: 500, expected: /500 Provider Error/ },
       ];

       for (const { status, expected } of testCases) {
         server.use(
           http.post('https://openrouter.ai/api/v1/chat/completions', () => {
             return new HttpResponse(JSON.stringify({ error: { message: 'API Error' } }), { status });
           })
         );

         await expect(service.generateChatCompletion({ 
           systemPrompt: 's', 
           userPrompt: 'u', 
           responseSchema: {} 
         })).rejects.toThrow(expected);
       }
    });

    it('should throw error for empty response from OpenRouter', async () => {
      server.use(
        http.post('https://openrouter.ai/api/v1/chat/completions', () => {
          return HttpResponse.json({
            choices: [
              {
                message: {
                  content: null,
                },
              },
            ],
          });
        })
      );

      await expect(service.generateChatCompletion({ 
        systemPrompt: 's', 
        userPrompt: 'u', 
        responseSchema: {} 
      })).rejects.toThrow(/Empty response/);
    });
  });
});
