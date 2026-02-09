import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface SessionControlsProps {
  isFlipped: boolean;
  onFlip: () => void;
  onKnown: () => void;
  onRepeat: () => void;
  disabled?: boolean;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  isFlipped,
  onFlip,
  onKnown,
  onRepeat,
  disabled = false,
}) => {
  return (
    <div className="flex gap-4 w-full h-16 max-w-md mx-auto">
      {isFlipped ? (
        <div className="flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Button
            variant="outline"
            className="flex-1 h-full text-lg font-semibold border-2 hover:bg-muted"
            onClick={onRepeat}
            disabled={disabled}
          >
            <span className="mr-2 text-xs opacity-60 bg-muted px-2 py-0.5 rounded border shadow-sm">1</span>
            Powtórz
          </Button>
          <Button
            className="flex-1 h-full text-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
            onClick={onKnown}
            disabled={disabled}
          >
            <span className="mr-2 text-xs opacity-60 bg-white/20 px-2 py-0.5 rounded border border-white/30 shadow-sm">
              2
            </span>
            Znam
            <Check className="ml-2 h-5 w-5" />
          </Button>
        </div>
      ) : (
        <Button
          className="w-full h-full text-lg font-semibold shadow-lg shadow-primary/10"
          onClick={onFlip}
          disabled={disabled}
        >
          Pokaż odpowiedź
          <span className="ml-2 text-xs opacity-60 bg-white/20 px-2 py-0.5 rounded border border-white/30 shadow-sm ml-4">
            Spacja
          </span>
        </Button>
      )}
    </div>
  );
};
