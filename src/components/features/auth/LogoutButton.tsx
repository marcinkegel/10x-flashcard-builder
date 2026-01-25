import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Hard redirect to login page
        window.location.href = "/login";
      } else {
        // eslint-disable-next-line no-console
        console.error("Logout failed");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoading} className="flex items-center gap-2">
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Wyloguj</span>
    </Button>
  );
}
