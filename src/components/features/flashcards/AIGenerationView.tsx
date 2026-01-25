import { AIGenerationForm } from "./AIGenerationForm";
import { ProposalList } from "./ProposalList";
import { BulkActionToolbar } from "./BulkActionToolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenerationSession } from "@/components/hooks/useGenerationSession";
import { toast } from "sonner";
import { useState } from "react";

/**
 * Main view for AI flashcard generation.
 * Orchestrates the form, proposal list, and bulk actions.
 */
export function AIGenerationView() {
  const { proposals, isGenerating, isSaving, generate, updateProposal, saveBulk, clearSession } =
    useGenerationSession();

  const [saveError, setSaveError] = useState<string | null>(null);

  const acceptedCount = proposals.filter((p) => p.status === "accepted").length;
  const nonRejectedCount = proposals.filter((p) => p.status !== "rejected").length;
  const anyEditing = proposals.some((p) => p.isEditing);

  const handleSave = async (strategy: "accepted_only" | "non_rejected") => {
    setSaveError(null);
    const result = await saveBulk(strategy);
    if (result.success) {
      toast.success(`Zapisano ${result.count} fiszek!`);
    } else {
      setSaveError(result.error || "Błąd podczas zapisywania.");
    }
    return result;
  };

  const handleClear = () => {
    if (confirm("Czy na pewno chcesz usunąć wszystkie niezapisane propozycje?")) {
      clearSession();
      toast.info("Wyczyszczono listę propozycji.");
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Nowa sesja generowania</h2>
          <AIGenerationForm
            onGenerate={generate}
            isGenerating={isGenerating}
            hasActiveProposals={proposals.length > 0}
          />
        </section>

        {saveError && (
          <div className="p-4 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {saveError}
          </div>
        )}

        {isGenerating && proposals.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[250px] border-2 rounded-lg p-6 space-y-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        )}

        {proposals.length > 0 && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Propozycje AI ({proposals.length})</h2>
              <p className="text-sm text-muted-foreground italic">Przejrzyj, edytuj i zatwierdź przed zapisaniem.</p>
            </div>
            <ProposalList proposals={proposals} onUpdateProposal={updateProposal} />
          </section>
        )}
      </div>

      {proposals.length > 0 && (
        <BulkActionToolbar
          onSave={handleSave}
          onClear={handleClear}
          isSaving={isSaving}
          anyEditing={anyEditing}
          acceptedCount={acceptedCount}
          nonRejectedCount={nonRejectedCount}
        />
      )}
    </div>
  );
}
