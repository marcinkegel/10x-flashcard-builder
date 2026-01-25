import type { FlashcardDTO } from "@/types";
import { FlashcardItem } from "./FlashcardItem";
import { FlashcardSkeleton } from "./FlashcardSkeleton";

interface FlashcardListProps {
  flashcards: FlashcardDTO[];
  isLoading: boolean;
  onUpdate: (updated: FlashcardDTO) => void;
  onDelete: (id: string) => void;
}

export function FlashcardList({ flashcards, isLoading, onUpdate, onDelete }: FlashcardListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <FlashcardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {flashcards.map((flashcard, index) => (
        <FlashcardItem key={flashcard.id} flashcard={flashcard} onUpdate={onUpdate} onDelete={onDelete} index={index} />
      ))}
    </div>
  );
}
