import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginForm } from "@/components/features/auth/LoginForm";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    const location = new URL("http://localhost/login");
    vi.stubGlobal("location", {
      ...location,
      href: location.href,
      search: "",
    });
  });

  it("poprawnie loguje użytkownika i przekierowuje", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Hasło/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /Zaloguj się/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/login", expect.any(Object));
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/generate");
    });
  });

  it("obsługuje błędy logowania", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    } as Response);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Hasło/i), { target: { value: "wrong" } });

    fireEvent.click(screen.getByRole("button", { name: /Zaloguj się/i }));

    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
  });
});
