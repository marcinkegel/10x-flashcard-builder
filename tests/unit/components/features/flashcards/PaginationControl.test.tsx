import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaginationControl } from '@/components/features/flashcards/PaginationControl';

describe('PaginationControl', () => {
  const mockOnPageChange = vi.fn();

  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <PaginationControl 
        currentPage={1} 
        totalPages={1} 
        onPageChange={mockOnPageChange} 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly for multiple pages', () => {
    render(
      <PaginationControl 
        currentPage={1} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('disables "Poprzednia strona" on first page', () => {
    render(
      <PaginationControl 
        currentPage={1} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    const prevButton = screen.getByRole('button', { name: /Poprzednia strona/i });
    expect(prevButton).toBeDisabled();
  });

  it('disables "Następna strona" on last page', () => {
    render(
      <PaginationControl 
        currentPage={5} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /Następna strona/i });
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange when a page number is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaginationControl 
        currentPage={3} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    await user.click(screen.getByText('2'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when "Następna strona" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <PaginationControl 
        currentPage={1} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    await user.click(screen.getByRole('button', { name: /Następna strona/i }));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('shows ellipsis correctly for large number of pages', () => {
    render(
      <PaginationControl 
        currentPage={5} 
        totalPages={10} 
        onPageChange={mockOnPageChange} 
      />
    );
    
    // Page buttons: 1, ..., 4, 5, 6, ..., 10
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('disables all buttons when disabled prop is true', () => {
    render(
      <PaginationControl 
        currentPage={2} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
        disabled={true}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
