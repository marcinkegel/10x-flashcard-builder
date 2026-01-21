import { Button } from "@/components/ui/button";
import { Save, CheckCheck, Trash2 } from "lucide-react";
import type { SaveStrategy } from "@/components/hooks/useGenerationSession";

interface BulkActionToolbarProps {
  onSave: (strategy: SaveStrategy) => Promise<{ success: boolean; error?: string }>;
  onClear: () => void;
  isSaving: boolean;
  anyEditing: boolean;
  acceptedCount: number;
  nonRejectedCount: number;
}

/**
 * Sticky toolbar for bulk actions on flashcard proposals.
 */
export function BulkActionToolbar({
  onSave,
  onClear,
  isSaving,
  anyEditing,
  acceptedCount,
  nonRejectedCount,
}: BulkActionToolbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50 flex justify-center shadow-lg">
      <div className="max-w-4xl w-full flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col">
          <div className="text-sm text-muted-foreground font-medium">
            {anyEditing ? (
              <span className="text-destructive">Zakończ edycję, aby zapisać</span>
            ) : (
              <span>Gotowe do zapisu: {nonRejectedCount} fiszek</span>
            )}
          </div>
          {!anyEditing && (
            <button 
              onClick={onClear}
              className="text-xs text-destructive hover:underline flex items-center mt-1"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Usuń niezapisane
            </button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={isSaving || anyEditing || acceptedCount === 0}
            onClick={() => onSave("accepted_only")}
            className="w-full md:w-auto"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Zapisz tylko zatwierdzone ({acceptedCount})
          </Button>
          <Button
            size="sm"
            disabled={isSaving || anyEditing || nonRejectedCount === 0}
            onClick={() => onSave("non_rejected")}
            className="w-full md:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Zapisz nieodrzucone ({nonRejectedCount})
          </Button>
        </div>
      </div>
    </div>
  );
}
