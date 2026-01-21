import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  min?: number;
  max: number;
  className?: string;
}

/**
 * A simple component to display character count with validation status.
 */
export function CharacterCounter({
  current,
  min,
  max,
  className,
}: CharacterCounterProps) {
  const isOver = current > max;
  const isUnder = min !== undefined && current < min && current > 0;
  const isInvalid = isOver || isUnder;

  return (
    <div
      className={cn(
        "text-xs text-muted-foreground tabular-nums",
        isInvalid && "text-destructive font-medium",
        className
      )}
    >
      {current} / {max}
      {min !== undefined && current < min && current > 0 && (
        <span className="ml-1">(min {min})</span>
      )}
    </div>
  );
}
