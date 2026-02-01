import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIGenerationView } from "./AIGenerationView";
import { ManualCreationView } from "./ManualCreationView";
import { useGenerationSession } from "@/components/hooks/useGenerationSession";
import { Toaster } from "@/components/ui/sonner";

/**
 * Main container for flashcard creation view.
 * Handles the tabs (AI vs Manual) and warns before leaving if there are unsaved proposals.
 */
export default function CreateFlashcardsContainer() {
  const { proposals } = useGenerationSession();

  // 1. beforeunload: Warn before losing unsaved data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (proposals.length > 0) {
        e.preventDefault();
        e.returnValue = "Masz niezapisane propozycje fiszek. Czy na pewno chcesz opuścić stronę?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [proposals.length]);

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4">
      <div className="flex flex-col space-y-2 mb-8 text-center md:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">Twórz nowe fiszki</h1>
        <p className="text-muted-foreground text-lg">Wybierz metodę tworzenia i zacznij budować swoją bazę wiedzy.</p>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <div className="flex justify-center md:justify-start">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ai" data-testid="ai-tab-trigger">Generowanie AI</TabsTrigger>
            <TabsTrigger value="manual" data-testid="manual-tab-trigger">Tworzenie ręczne</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ai" className="mt-0">
          <AIGenerationView />
        </TabsContent>

        <TabsContent value="manual" className="mt-0">
          <ManualCreationView />
        </TabsContent>
      </Tabs>

      <Toaster position="top-right" closeButton richColors />
    </div>
  );
}
