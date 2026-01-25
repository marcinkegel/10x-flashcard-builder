import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Library, Plus } from "lucide-react";

export function EmptyState() {
  return (
    <Card className="border-dashed border-2 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <Library className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Twoja biblioteka jest pusta</h3>
          <p className="text-muted-foreground max-w-sm">
            Nie masz jeszcze żadnych zapisanych fiszek. Zacznij od wygenerowania ich z tekstu lub dodania ręcznie.
          </p>
        </div>
        <Button asChild>
          <a href="/generate">
            <Plus className="w-4 h-4 mr-2" />
            Utwórz pierwsze fiszki
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
