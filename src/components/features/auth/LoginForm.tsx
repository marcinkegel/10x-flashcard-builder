import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas logowania");
      }

      // Success: redirect to app or the requested path
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirectTo") || "/generate";
      window.location.href = redirectTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const redirectTo = params?.get("redirectTo");
  const registerUrl = redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : "/register";

  return (
    <Card className="w-full" data-testid="login-form">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Zaloguj się</CardTitle>
        <CardDescription className="text-center">
          Wprowadź swój adres e-mail i hasło, aby uzyskać dostęp do konta
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div
              data-testid="login-error"
              className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1"
            >
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              data-testid="login-email-input"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Hasło</Label>
              <a
                href="/forgot-password"
                data-testid="forgot-password-link"
                className="text-sm font-medium text-primary hover:underline"
              >
                Zapomniałeś hasła?
              </a>
            </div>
            <Input
              id="password"
              data-testid="login-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4">
          <Button type="submit" data-testid="login-submit-button" className="w-full" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Nie masz jeszcze konta?{" "}
            <a href={registerUrl} data-testid="register-link" className="font-medium text-primary hover:underline">
              Zarejestruj się
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
