import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd podczas wysyłania linku");
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sprawdź e-mail</CardTitle>
          <CardDescription className="text-center">
            Jeśli konto z adresem <strong>{email}</strong> istnieje, wysłaliśmy na nie instrukcje resetowania hasła.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <a href="/login">Powrót do logowania</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Odzyskiwanie hasła</CardTitle>
        <CardDescription className="text-center">
          Wprowadź swój adres e-mail, aby otrzymać link do resetowania hasła
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wysyłanie..." : "Wyślij link do resetu"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Pamiętasz hasło?{" "}
            <a href="/login" className="font-medium text-primary hover:underline">
              Zaloguj się
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
