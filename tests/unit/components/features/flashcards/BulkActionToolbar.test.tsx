import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BulkActionToolbar } from "../../../../../src/components/features/flashcards/BulkActionToolbar";

describe("BulkActionToolbar", () => {
  const defaultProps = {
    onSave: vi.fn(),
    onClear: vi.fn(),
    isSaving: false,
    anyEditing: false,
    acceptedCount: 5,
    nonRejectedCount: 10,
  };

  it("should display the correct count of flashcards ready to save", () => {
    render(<BulkActionToolbar {...defaultProps} />);
    expect(screen.getByText("Gotowe do zapisu: 10 fiszek")).toBeInTheDocument();
  });

  it("should show a warning message when editing is in progress", () => {
    render(<BulkActionToolbar {...defaultProps} anyEditing={true} />);
    expect(screen.getByText("Zakończ edycję, aby zapisać")).toBeInTheDocument();
    expect(screen.queryByText("Gotowe do zapisu:")).not.toBeInTheDocument();
  });

  it("should disable buttons when anyEditing is true", () => {
    render(<BulkActionToolbar {...defaultProps} anyEditing={true} />);
    const saveAcceptedButton = screen.getByRole("button", { name: /Zapisz tylko zatwierdzone/i });
    const saveNonRejectedButton = screen.getByRole("button", { name: /Zapisz nieodrzucone/i });

    expect(saveAcceptedButton).toBeDisabled();
    expect(saveNonRejectedButton).toBeDisabled();
  });

  it("should disable buttons when isSaving is true", () => {
    render(<BulkActionToolbar {...defaultProps} isSaving={true} />);
    const saveAcceptedButton = screen.getByRole("button", { name: /Zapisz tylko zatwierdzone/i });
    const saveNonRejectedButton = screen.getByRole("button", { name: /Zapisz nieodrzucone/i });

    expect(saveAcceptedButton).toBeDisabled();
    expect(saveNonRejectedButton).toBeDisabled();
  });

  it("should disable save accepted button when acceptedCount is 0", () => {
    render(<BulkActionToolbar {...defaultProps} acceptedCount={0} />);
    const saveAcceptedButton = screen.getByRole("button", { name: /Zapisz tylko zatwierdzone/i });
    expect(saveAcceptedButton).toBeDisabled();
  });

  it("should call onSave with 'accepted_only' when clicking save accepted button", () => {
    render(<BulkActionToolbar {...defaultProps} />);
    const saveAcceptedButton = screen.getByRole("button", { name: /Zapisz tylko zatwierdzone/i });
    fireEvent.click(saveAcceptedButton);
    expect(defaultProps.onSave).toHaveBeenCalledWith("accepted_only");
  });

  it("should call onSave with 'non_rejected' when clicking save non-rejected button", () => {
    render(<BulkActionToolbar {...defaultProps} />);
    const saveNonRejectedButton = screen.getByRole("button", { name: /Zapisz nieodrzucone/i });
    fireEvent.click(saveNonRejectedButton);
    expect(defaultProps.onSave).toHaveBeenCalledWith("non_rejected");
  });

  it("should call onClear when clicking clear button", () => {
    render(<BulkActionToolbar {...defaultProps} />);
    const clearButton = screen.getByRole("button", { name: /Usuń niezapisane/i });
    fireEvent.click(clearButton);
    expect(defaultProps.onClear).toHaveBeenCalled();
  });
});
