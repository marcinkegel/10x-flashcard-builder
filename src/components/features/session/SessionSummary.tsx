import React from "react";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Home, Target, Repeat, Layers } from "lucide-react";
import type { SessionStatsVM } from "@/types";

interface SessionSummaryProps {
  stats: SessionStatsVM;
  onRestart: () => void;
  onExit: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({ stats, onRestart, onExit }) => {
  const accuracy = Math.round((stats.firstTimeCorrect / stats.totalCards) * 100) || 0;

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="bg-primary/10 p-6 rounded-full mb-6 ring-8 ring-primary/5 animate-bounce">
        <Trophy className="h-12 w-12 text-primary" />
      </div>

      <h1 className="text-3xl font-bold mb-2 tracking-tight">Świetna robota!</h1>
      <p className="text-muted-foreground mb-8">Ukończyłeś sesję nauki i przyswoiłeś nową wiedzę.</p>

      <div className="grid grid-cols-2 gap-4 w-full mb-10">
        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center">
          <Layers className="h-5 w-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{stats.totalCards}</p>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fiszki</p>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center">
          <Target className="h-5 w-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{accuracy}%</p>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bez powtórzeń</p>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col items-center col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold">{stats.totalRepeats}</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-center">
            Tyle razy powtórzyłeś karty przed zapamiętaniem
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <Button onClick={onRestart} className="w-full h-12 text-lg shadow-lg shadow-primary/20">
          <RotateCcw className="mr-2 h-5 w-5" /> Nowa sesja
        </Button>
        <Button onClick={onExit} variant="outline" className="w-full h-12 text-lg">
          <Home className="mr-2 h-5 w-5" /> Wróć do biblioteki
        </Button>
      </div>
    </div>
  );
};
