import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlashcardsLibrary } from '@/components/features/flashcards/FlashcardsLibrary';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.scrollTo
window.scrollTo = vi.fn();

describe('FlashcardsLibrary', () => {
  const mockFlashcards = [
    { id: '1', front: 'Front 1', back: 'Back 1', source: 'manual' },
    { id: '2', front: 'Front 2', back: 'Back 2', source: 'manual' },
  ];

  const mockPagination = {
    total: 2,
    total_pages: 1,
    current_page: 1,
    limit: 12,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Return a never-resolving promise to stay in loading state
    mockFetch.mockReturnValue(new Promise(() => {}));
    
    const { container } = render(<FlashcardsLibrary />);
    // Check for skeleton containers
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders empty state when no flashcards are returned', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        success: true,
        data: { items: [], pagination: { total: 0, total_pages: 0, current_page: 1, limit: 12 } }
      }),
    });

    render(<FlashcardsLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Twoja biblioteka jest pusta')).toBeInTheDocument();
    });
  });

  it('renders list of flashcards and pagination info', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        success: true,
        data: { items: mockFlashcards, pagination: mockPagination }
      }),
    });

    render(<FlashcardsLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Front 1')).toBeInTheDocument();
      expect(screen.getByText('Front 2')).toBeInTheDocument();
      expect(screen.getByText(/Razem:/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('handles page change', async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          success: true,
          data: { 
            items: mockFlashcards, 
            pagination: { ...mockPagination, total: 15, total_pages: 2 } 
          }
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          success: true,
          data: { 
            items: [{ id: '3', front: 'Front 3', back: 'Back 3' }], 
            pagination: { total: 15, total_pages: 2, current_page: 2, limit: 12 } 
          }
        }),
      });

    render(<FlashcardsLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Front 1')).toBeInTheDocument();
    });

    const page2Button = screen.getByRole('button', { name: '2' });
    await user.click(page2Button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Use a more direct check for the last call
      const lastCallUrl = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0];
      expect(lastCallUrl).toContain('page=2');
      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  it('handles error state', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      json: async () => ({
        success: false,
        error: { message: 'Server Error' }
      }),
    });

    render(<FlashcardsLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(screen.getByText(/Spróbuj ponownie/i)).toBeInTheDocument();
    });
  });

  it('redirects to login on 401 status', async () => {
    // Mock window.location.href
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    mockFetch.mockResolvedValueOnce({
      status: 401,
    });

    render(<FlashcardsLibrary />);

    await waitFor(() => {
      expect(window.location.href).toBe('/login');
    });

    window.location = originalLocation;
  });
});
