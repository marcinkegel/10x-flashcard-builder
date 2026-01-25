import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileView } from "@/components/features/auth/ProfileView";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock UpdatePasswordForm to avoid testing it here
vi.mock("@/components/features/auth/UpdatePasswordForm", () => ({
  UpdatePasswordForm: () => <div>Update Password Form</div>
}));

describe("ProfileView", () => {
  const mockUser = { id: "123", email: "test@example.com" };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // Mock window.location
    vi.stubGlobal("location", { href: "/profile" });
  });

  it("wyświetla informacje o użytkowniku", () => {
    render(<ProfileView user={mockUser} />);
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Update Password Form/i)).toBeInTheDocument();
  });

  it("obsługuje usuwanie konta po potwierdzeniu", async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true });
    
    render(<ProfileView user={mockUser} />);
    
    // Kliknij "Usuń konto", aby otworzyć dialog
    fireEvent.click(screen.getByRole("button", { name: /Usuń konto/i }));
    
    // Kliknij "Tak, usuń moje konto" w dialogu
    const confirmButton = screen.getByRole("button", { name: /Tak, usuń moje konto/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/delete-account", { method: "POST" });
    });

    expect(toast.success).toHaveBeenCalledWith("Konto zostało pomyślnie usunięte");
    expect(window.location.href).toBe("/login");
  });

  it("obsługuje błąd usuwania konta", async () => {
    (fetch as any).mockResolvedValueOnce({ 
      ok: false, 
      json: async () => ({ error: "Failed to delete" }) 
    });
    
    render(<ProfileView user={mockUser} />);
    
    fireEvent.click(screen.getByRole("button", { name: /Usuń konto/i }));
    fireEvent.click(screen.getByRole("button", { name: /Tak, usuń moje konto/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete");
    });
  });
});
