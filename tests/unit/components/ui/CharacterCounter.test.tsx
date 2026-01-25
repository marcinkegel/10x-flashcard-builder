import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharacterCounter } from '@/components/ui/character-counter';

describe('CharacterCounter', () => {
  it('renders current and max count', () => {
    render(<CharacterCounter current={10} max={100} />);
    expect(screen.getByText('10 / 100')).toBeInTheDocument();
  });

  it('renders minimum required count when specified', () => {
    render(<CharacterCounter current={5} min={10} max={100} />);
    expect(screen.getByText(/min 10/)).toBeInTheDocument();
  });

  it('applies destructive class when count is over max', () => {
    const { container } = render(<CharacterCounter current={110} max={100} />);
    expect(container.firstChild).toHaveClass('text-destructive');
  });

  it('applies destructive class when count is under min (and > 0)', () => {
    const { container } = render(<CharacterCounter current={5} min={10} max={100} />);
    expect(container.firstChild).toHaveClass('text-destructive');
  });

  it('does not apply destructive class when count is 0 even if under min', () => {
    const { container } = render(<CharacterCounter current={0} min={10} max={100} />);
    expect(container.firstChild).not.toHaveClass('text-destructive');
  });

  it('does not apply destructive class when within limits', () => {
    const { container } = render(<CharacterCounter current={50} min={10} max={100} />);
    expect(container.firstChild).not.toHaveClass('text-destructive');
  });
});
