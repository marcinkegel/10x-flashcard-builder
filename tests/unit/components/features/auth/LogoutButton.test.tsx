import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogoutButton } from "@/components/features/auth/LogoutButton";

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // Mock window.location
    const location = new URL("http://localhost/generate");
    vi.stubGlobal("location", {
      ...location,
      href: location.href,
    });
  });

  it("wywołuje API wylogowania i przekierowuje do strony logowania", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
    } as Response);

    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText(/Wyloguj/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/login");
    });
  });

  it("obsługuje błąd wylogowania (console.error)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Logout failed");
    });

    consoleSpy.mockRestore();
  });
});
