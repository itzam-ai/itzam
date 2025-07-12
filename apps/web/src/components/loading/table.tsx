import { Skeleton } from "../ui/skeleton";

export function TableLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border">
        {/* Table header */}
        <div className="border-b bg-muted/50 px-4 py-3">
          <div className="grid grid-cols-6 gap-4">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-8" />
          </div>
        </div>

        {/* Table rows */}
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-4 py-3">
              <div className="grid grid-cols-6 gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
