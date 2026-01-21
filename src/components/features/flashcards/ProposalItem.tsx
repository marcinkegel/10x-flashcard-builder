import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CharacterCounter } from "@/components/ui/character-counter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FlashcardProposalViewModel } from "@/types";
import { Check, X, Pencil, Save, RotateCcw } from "lucide-react";

interface ProposalItemProps {
  proposal: FlashcardProposalViewModel;
  onUpdate: (id: string, partial: Partial<FlashcardProposalViewModel>) => void;
}

/**
 * Component for a single AI-generated flashcard proposal.
 * Supports view and edit modes, and status management.
 */
export function ProposalItem({ proposal, onUpdate }: ProposalItemProps) {
  const [front, setFront] = useState(proposal.front);
  const [back, setBack] = useState(proposal.back);
  const [error, setError] = useState<string | null>(null);

  const isEditing = proposal.isEditing;

  const handleStatusChange = (status: "accepted" | "rejected") => {
    onUpdate(proposal.id, { status });
  };

  const handleEdit = () => {
    onUpdate(proposal.id, { isEditing: true });
  };

  const handleCancelEdit = () => {
    setFront(proposal.front);
    setBack(proposal.back);
    onUpdate(proposal.id, { isEditing: false });
    setError(null);
  };

  const handleSaveEdit = () => {
    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    if (trimmedFront.length === 0 || trimmedFront.length > 200) {
      setError("Niepoprawna długość frontu.");
      return;
    }
    if (trimmedBack.length === 0 || trimmedBack.length > 500) {
      setError("Niepoprawna długość tyłu.");
      return;
    }

    onUpdate(proposal.id, {
      front: trimmedFront,
      back: trimmedBack,
      source: "ai-edited",
      status: "accepted",
      isEditing: false,
    });
    setError(null);
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 border-2",
        proposal.status === "accepted" && "border-green-500 bg-green-50/30",
        proposal.status === "rejected" && "border-red-500 opacity-60 bg-red-50/30",
        proposal.status === "pending" && "border-transparent"
      )}
    >
      <CardContent className="pt-6 space-y-4">
        {error && (
          <div className="p-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Przód</span>
            {isEditing && <CharacterCounter current={front.length} max={200} />}
          </div>
          {isEditing ? (
            <Textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          ) : (
            <p className="text-sm min-h-[40px] whitespace-pre-wrap">{proposal.front}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Tył</span>
            {isEditing && <CharacterCounter current={back.length} max={500} />}
          </div>
          {isEditing ? (
            <Textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          ) : (
            <p className="text-sm min-h-[40px] whitespace-pre-wrap">{proposal.back}</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between bg-muted/30 pt-4 pb-4">
        {isEditing ? (
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleCancelEdit}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Anuluj
            </Button>
            <Button size="sm" className="flex-1" onClick={handleSaveEdit}>
              <Save className="w-4 h-4 mr-2" />
              Zapisz edycję
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={proposal.status === "accepted" ? "default" : "outline"}
                className={cn(
                  proposal.status === "accepted" && "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => handleStatusChange("accepted")}
              >
                <Check className="w-4 h-4 mr-2" />
                Zatwierdź
              </Button>
              <Button
                size="sm"
                variant={proposal.status === "rejected" ? "destructive" : "outline"}
                onClick={() => handleStatusChange("rejected")}
              >
                <X className="w-4 h-4 mr-2" />
                Odrzuć
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={handleEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edytuj
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
