import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    // Basic password validation based on spec
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Hasło musi mieć min. 8 znaków, zawierać małe i wielkie litery, cyfry oraz znaki specjalne");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas aktualizacji hasła");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    const isProfilePage = typeof window !== "undefined" && window.location.pathname === "/profile";

    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Hasło zaktualizowane</CardTitle>
          <CardDescription className="text-center">Twoje hasło zostało pomyślnie zmienione.</CardDescription>
        </CardHeader>
        <CardFooter>
          {isProfilePage ? (
            <Button className="w-full" onClick={() => setIsSuccess(false)}>
              Powrót do profilu
            </Button>
          ) : (
            <Button className="w-full" asChild>
              <a href="/login">Zaloguj się</a>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Nowe hasło</CardTitle>
        <CardDescription className="text-center">Wprowadź swoje nowe hasło poniżej</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Potwierdź nowe hasło</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Aktualizacja..." : "Zapisz nowe hasło"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
