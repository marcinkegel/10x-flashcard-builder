import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProposalItem } from "@/components/features/flashcards/ProposalItem";
import type { FlashcardProposalViewModel } from "@/types";

describe("ProposalItem", () => {
  const mockProposal: FlashcardProposalViewModel = {
    id: "prop-1",
    front: "Front text",
    back: "Back text",
    status: "pending",
    source: "ai-full",
    isEditing: false,
  };

  const mockOnUpdate = vi.fn();

  it("renders front and back text in view mode", () => {
    render(<ProposalItem proposal={mockProposal} onUpdate={mockOnUpdate} />);
    expect(screen.getByText("Front text")).toBeInTheDocument();
    expect(screen.getByText("Back text")).toBeInTheDocument();
  });

  it('calls onUpdate with accepted status when "Zatwierdź" is clicked', async () => {
    const user = userEvent.setup();
    render(<ProposalItem proposal={mockProposal} onUpdate={mockOnUpdate} />);

    await user.click(screen.getByRole("button", { name: /Zatwierdź/i }));
    expect(mockOnUpdate).toHaveBeenCalledWith("prop-1", { status: "accepted" });
  });

  it('calls onUpdate with rejected status when "Odrzuć" is clicked', async () => {
    const user = userEvent.setup();
    render(<ProposalItem proposal={mockProposal} onUpdate={mockOnUpdate} />);

    await user.click(screen.getByRole("button", { name: /Odrzuć/i }));
    expect(mockOnUpdate).toHaveBeenCalledWith("prop-1", { status: "rejected" });
  });

  it('switches to edit mode when "Edytuj" is clicked', async () => {
    const user = userEvent.setup();
    render(<ProposalItem proposal={mockProposal} onUpdate={mockOnUpdate} />);

    await user.click(screen.getByRole("button", { name: /Edytuj/i }));
    expect(mockOnUpdate).toHaveBeenCalledWith("prop-1", { isEditing: true });
  });

  it("validates text length during edit", async () => {
    const user = userEvent.setup();
    const editingProposal = { ...mockProposal, isEditing: true };
    render(<ProposalItem proposal={editingProposal} onUpdate={mockOnUpdate} />);

    const frontInput = screen.getByDisplayValue("Front text");
    await user.clear(frontInput);
    await user.click(screen.getByRole("button", { name: /Zapisz edycję/i }));

    expect(screen.getByText("Niepoprawna długość frontu.")).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalledWith("prop-1", expect.objectContaining({ front: "" }));
  });

  it("calls onUpdate with new data and accepted status when valid edit is saved", async () => {
    const user = userEvent.setup();
    const editingProposal = { ...mockProposal, isEditing: true };
    render(<ProposalItem proposal={editingProposal} onUpdate={mockOnUpdate} />);

    const frontInput = screen.getByDisplayValue("Front text");
    await user.clear(frontInput);
    await user.type(frontInput, "Updated front");

    await user.click(screen.getByRole("button", { name: /Zapisz edycję/i }));

    expect(mockOnUpdate).toHaveBeenCalledWith("prop-1", {
      front: "Updated front",
      back: "Back text",
      source: "ai-edited",
      status: "accepted",
      isEditing: false,
    });
  });

  it('resets local state and cancels edit mode when "Anuluj" is clicked', async () => {
    const user = userEvent.setup();
    const editingProposal = { ...mockProposal, isEditing: true };
    render(<ProposalItem proposal={editingProposal} onUpdate={mockOnUpdate} />);

    const frontInput = screen.getByDisplayValue("Front text");
    await user.type(frontInput, "Trying to change");

    await user.click(screen.getByRole("button", { name: /Anuluj/i }));

    expect(mockOnUpdate).toHaveBeenCalledWith("prop-1", { isEditing: false });
    // After re-render with isEditing: false (handled by parent usually),
    // local state front would be reset next time it's opened.
  });
});
