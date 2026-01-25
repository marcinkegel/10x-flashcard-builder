import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function PaginationControl({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationControlProps) {
  if (totalPages <= 1) return null;

  const renderPageButtons = () => {
    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    // First page
    pages.push(
      <Button
        key={1}
        variant={currentPage === 1 ? "default" : "outline"}
        size="icon"
        className="h-9 w-9"
        onClick={() => onPageChange(1)}
        disabled={disabled}
      >
        1
      </Button>
    );

    if (showEllipsisStart) {
      pages.push(
        <div key="start-ellipsis" className="flex items-center justify-center w-9 h-9">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }

    // Pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="icon"
          className="h-9 w-9"
          onClick={() => onPageChange(i)}
          disabled={disabled}
        >
          {i}
        </Button>
      );
    }

    if (showEllipsisEnd) {
      pages.push(
        <div key="end-ellipsis" className="flex items-center justify-center w-9 h-9">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }

    // Last page
    if (totalPages > 1) {
      pages.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="icon"
          className="h-9 w-9"
          onClick={() => onPageChange(totalPages)}
          disabled={disabled}
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Poprzednia strona</span>
      </Button>

      <div className="flex items-center gap-2">{renderPageButtons()}</div>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Następna strona</span>
      </Button>
    </div>
  );
}
