import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForgotPasswordForm } from "@/components/features/auth/ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("wyświetla komunikat o sukcesie po wysłaniu maila", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Wyślij link do resetu/i }));

    expect(await screen.findByText(/Sprawdź e-mail/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it("obsługuje błędy z API", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "User not found" }),
    });

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "unknown@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Wyślij link do resetu/i }));

    expect(await screen.findByText(/User not found/i)).toBeInTheDocument();
  });
});
