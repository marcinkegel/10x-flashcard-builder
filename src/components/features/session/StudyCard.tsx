import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StudyCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onClick: () => void;
}

export const StudyCard: React.FC<StudyCardProps> = ({ front, back, isFlipped, onClick }) => {
  return (
    <div
      className="group perspective-1000 w-full max-w-[min(90vw,400px)] aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? "Odwróć na przód" : "Odwróć na tył"}
    >
      <div
        className={cn(
          "relative w-full h-full transition-all duration-500 transform-style-3d",
          isFlipped ? "rotate-y-180" : ""
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <Card className="w-full h-full flex items-center justify-center p-8 text-center bg-card border-2">
            <CardContent className="flex flex-col items-center justify-center h-full pt-6 px-4 sm:px-8">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-4 opacity-70 tracking-widest uppercase">
                FRONT
              </span>
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold leading-tight break-words overflow-y-auto max-h-[70%] scrollbar-hide">
                {front}
              </p>
              <p className="mt-auto text-[10px] sm:text-xs text-muted-foreground animate-pulse">
                Kliknij, aby odwrócić
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <Card className="w-full h-full flex items-center justify-center p-8 text-center bg-muted/50 border-2 border-primary/20 shadow-inner">
            <CardContent className="flex flex-col items-center justify-center h-full pt-6 px-4 sm:px-8">
              <span className="text-xs sm:text-sm font-medium text-primary mb-4 tracking-widest uppercase">TYŁ</span>
              <p className="text-xl sm:text-2xl md:text-3xl font-semibold leading-tight break-words overflow-y-auto max-h-[80%] scrollbar-hide">
                {back}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
