import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SessionHeaderProps {
  currentCount: number;
  totalCount: number;
  isRepeatPhase: boolean;
  onExit: () => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({ currentCount, totalCount, isRepeatPhase, onExit }) => {
  return (
    <header className="flex items-center justify-between px-6 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight hidden sm:inline-block">Sesja Nauki</span>
          <span className="text-sm font-medium text-muted-foreground sm:ml-3">
            {isRepeatPhase ? (
              <span className="text-orange-600 dark:text-orange-400 font-bold animate-pulse">Powtórka kart</span>
            ) : (
              <>
                Karta <span className="text-foreground font-bold">{currentCount}</span> z{" "}
                <span className="text-foreground font-bold">{totalCount}</span>
              </>
            )}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onExit}
        className="text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        <X className="mr-2 h-4 w-4" /> Wyjdź
      </Button>
    </header>
  );
};
