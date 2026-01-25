import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdatePasswordForm } from "@/components/features/auth/UpdatePasswordForm";

describe("UpdatePasswordForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("wyświetla błąd, gdy hasła się nie zgadzają", async () => {
    render(<UpdatePasswordForm />);

    fireEvent.change(screen.getByLabelText(/^Nowe hasło/i), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByLabelText(/Potwierdź nowe hasło/i), { target: { value: "Different123!" } });

    fireEvent.click(screen.getByRole("button", { name: /Zapisz nowe hasło/i }));

    expect(await screen.findByText(/Hasła nie są identyczne/i)).toBeInTheDocument();
  });

  it("wyświetla błąd walidacji hasła, gdy jest za słabe", async () => {
    render(<UpdatePasswordForm />);

    fireEvent.change(screen.getByLabelText(/^Nowe hasło/i), { target: { value: "weak" } });
    fireEvent.change(screen.getByLabelText(/Potwierdź nowe hasło/i), { target: { value: "weak" } });

    fireEvent.click(screen.getByRole("button", { name: /Zapisz nowe hasło/i }));

    expect(await screen.findByText(/Hasło musi mieć min. 8 znaków/i)).toBeInTheDocument();
  });

  it("poprawnie aktualizuje hasło i wyświetla komunikat o sukcesie", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<UpdatePasswordForm />);

    fireEvent.change(screen.getByLabelText(/^Nowe hasło/i), { target: { value: "StrongPass123!" } });
    fireEvent.change(screen.getByLabelText(/Potwierdź nowe hasło/i), { target: { value: "StrongPass123!" } });

    fireEvent.click(screen.getByRole("button", { name: /Zapisz nowe hasło/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/update-password", expect.any(Object));
    });

    expect(await screen.findByText(/Hasło zaktualizowane/i)).toBeInTheDocument();
  });
});
