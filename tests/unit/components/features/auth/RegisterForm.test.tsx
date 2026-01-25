import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterForm } from "@/components/features/auth/RegisterForm";

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // Mock window.location
    const location = new URL("http://localhost/register");
    vi.stubGlobal("location", {
      ...location,
      href: location.href,
      search: "",
    });
  });

  it("wyświetla błąd, gdy hasła się nie zgadzają", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Hasło/i), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByLabelText(/Potwierdź hasło/i), { target: { value: "Different123!" } });

    fireEvent.click(screen.getByRole("button", { name: /Zarejestruj się/i }));

    expect(await screen.findByText(/Hasła nie są identyczne/i)).toBeInTheDocument();
  });

  it("wyświetla błąd walidacji hasła, gdy jest za słabe", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Hasło/i), { target: { value: "weak" } });
    fireEvent.change(screen.getByLabelText(/Potwierdź hasło/i), { target: { value: "weak" } });

    fireEvent.click(screen.getByRole("button", { name: /Zarejestruj się/i }));

    expect(await screen.findByText(/Hasło musi mieć min. 8 znaków/i)).toBeInTheDocument();
  });

  it("poprawnie rejestruje użytkownika i przekierowuje", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Hasło/i), { target: { value: "StrongPass123!" } });
    fireEvent.change(screen.getByLabelText(/Potwierdź hasło/i), { target: { value: "StrongPass123!" } });

    fireEvent.click(screen.getByRole("button", { name: /Zarejestruj się/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/register", expect.any(Object));
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/generate");
    });
  });

  it("obsługuje błędy z API", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email already exists" }),
    });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Hasło/i), { target: { value: "StrongPass123!" } });
    fireEvent.change(screen.getByLabelText(/Potwierdź hasło/i), { target: { value: "StrongPass123!" } });

    fireEvent.click(screen.getByRole("button", { name: /Zarejestruj się/i }));

    expect(await screen.findByText(/Email already exists/i)).toBeInTheDocument();
  });
});
