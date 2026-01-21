import { ManualFlashcardForm } from "./ManualFlashcardForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * View container for manual flashcard creation tab.
 */
export function ManualCreationView() {
  return (
    <div className="py-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Ręczne tworzenie fiszki</CardTitle>
          <CardDescription>
            Dodaj nową fiszkę wpisując treść pytania i odpowiedzi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualFlashcardForm />
        </CardContent>
      </Card>
    </div>
  );
}
