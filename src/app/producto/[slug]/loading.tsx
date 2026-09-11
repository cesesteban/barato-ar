import { PageShell } from "@/components/layout";
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
          <Skeleton className="h-96 w-full rounded-lg" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
