import { ProposalItem } from "./ProposalItem";
import type { FlashcardProposalViewModel } from "@/types";

interface ProposalListProps {
  proposals: FlashcardProposalViewModel[];
  onUpdateProposal: (id: string, partial: Partial<FlashcardProposalViewModel>) => void;
}

/**
 * List of AI-generated flashcard proposals.
 */
export function ProposalList({ proposals, onUpdateProposal }: ProposalListProps) {
  if (proposals.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {proposals.map((proposal) => (
        <ProposalItem
          key={proposal.id}
          proposal={proposal}
          onUpdate={onUpdateProposal}
        />
      ))}
    </div>
  );
}
