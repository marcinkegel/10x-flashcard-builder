import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FlashcardSkeleton() {
  return (
    <Card className="h-full flex flex-col border-2 border-transparent">
      <CardContent className="pt-6 space-y-4 flex-grow">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-24 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 bg-muted/30 pt-4 pb-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardFooter>
    </Card>
  );
}
