import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForgotPasswordForm } from "@/components/features/auth/ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("wyświetla komunikat o sukcesie po wysłaniu maila", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Wyślij link do resetu/i }));

    expect(await screen.findByText(/Sprawdź e-mail/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it("obsługuje błędy z API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "User not found" }),
    } as Response);

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "unknown@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Wyślij link do resetu/i }));

    expect(await screen.findByText(/User not found/i)).toBeInTheDocument();
  });
});
