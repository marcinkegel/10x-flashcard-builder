import { useState } from "react";
import { UpdatePasswordForm } from "./UpdatePasswordForm";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ProfileViewProps {
  user: {
    id: string;
    email: string;
  };
}

export function ProfileView({ user }: ProfileViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Nie udało się usunąć konta");
      }

      toast.success("Konto zostało pomyślnie usunięte");
      // Redirect to home page
      window.location.href = "/login";
    } catch (error: any) {
      toast.error(error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil i Ustawienia</h1>
        <p className="text-muted-foreground">
          Zarządzaj swoim kontem i preferencjami bezpieczeństwa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacje o koncie</CardTitle>
          <CardDescription>Twoje podstawowe dane profilowe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-1">
            <span className="text-sm font-medium text-muted-foreground">Email</span>
            <span className="text-lg">{user.email}</span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Bezpieczeństwo</h2>
        <UpdatePasswordForm />
      </section>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Strefa niebezpieczna</CardTitle>
          <CardDescription>
            Trwałe usunięcie konta i wszystkich powiązanych danych.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Po usunięciu konta wszystkie Twoje dane, w tym utworzone fiszki i historia generowania, zostaną bezpowrotnie usunięte. Akcja ta jest nieodwracalna (zgodnie z RODO).
          </p>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? "Usuwanie..." : "Usuń konto"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ta operacja jest nieodwracalna. Spowoduje to trwałe usunięcie Twojego konta oraz wszystkich danych z naszych serwerów.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Tak, usuń moje konto
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
