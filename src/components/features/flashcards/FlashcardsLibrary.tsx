import { useState, useEffect, useCallback } from "react";
import { FlashcardList } from "./FlashcardList";
import { PaginationControl } from "./PaginationControl";
import { EmptyState } from "./EmptyState";
import { Library, AlertCircle, RefreshCw, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { FlashcardDTO, ApiResponse, PaginatedData, PaginationDTO } from "@/types";

export function FlashcardsLibrary() {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchFlashcards = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/flashcards?page=${page}&limit=12`);

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const result: ApiResponse<PaginatedData<FlashcardDTO>> = await response.json();

      if (result.success && result.data) {
        setFlashcards(result.data.items);
        setPagination(result.data.pagination);
      } else {
        const errorMsg = result.error?.message || "Nie udało się pobrać fiszek.";
        setError(errorMsg);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching flashcards:", err);
      setError("Wystąpił problem z połączeniem z serwerem. Sprawdź swoje połączenie internetowe i spróbuj ponownie.");
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlashcards(currentPage);
  }, [currentPage, fetchFlashcards]);

  const handleUpdate = (updated: FlashcardDTO) => {
    setFlashcards((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleDelete = (id: string) => {
    setFlashcards((prev) => prev.filter((f) => f.id !== id));
    // If we deleted the last item on the page, go to previous page if it exists
    if (flashcards.length === 1 && currentPage > 1) {
      setCurrentPage((p) => p - 1);
    } else {
      // Refresh to get new item from next page if available
      fetchFlashcards(currentPage);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isInitialLoading) {
    return (
      <div data-testid="library-loading" className="space-y-8">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded-md" />
        </div>
        <FlashcardList
          flashcards={[]}
          isLoading={true}
          onUpdate={() => {
            /* noop */
          }}
          onDelete={() => {
            /* noop */
          }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="library-error" className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>{error}</p>
            <Button
              data-testid="retry-button"
              variant="outline"
              size="sm"
              onClick={() => fetchFlashcards(currentPage)}
              className="w-fit"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Spróbuj ponownie
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div data-testid="flashcards-library" className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Library className="w-6 h-6 text-primary" />
            <h1 data-testid="library-title" className="text-3xl font-bold tracking-tight">
              Moje fiszki
            </h1>
          </div>
          <p className="text-muted-foreground">
            Zarządzaj swoją bazą wiedzy. Przeglądaj, edytuj i usuwaj zapisane fiszki.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {pagination && pagination.total > 0 && (
            <>
              <Button
                data-testid="start-session-button"
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                onClick={() => (window.location.href = "/session")}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Rozpocznij naukę
              </Button>
              <div
                data-testid="flashcards-count"
                className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full w-fit h-9 flex items-center"
              >
                Razem: <span className="font-semibold text-foreground ml-1">{pagination.total}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {flashcards.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <FlashcardList
            flashcards={flashcards}
            isLoading={isLoading}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />

          {pagination && pagination.total_pages > 1 && (
            <PaginationControl
              currentPage={currentPage}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
              disabled={isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}
