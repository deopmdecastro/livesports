import Skeleton from "@/components/ui/Skeleton";

export default function PublicLoading() {
  return (
    <div className="min-h-[70vh] px-4 py-10 lg:px-6">
      <div className="mx-auto max-w-[1400px] space-y-8">
        {/* Hero skeleton */}
        <div className="h-[60vh] rounded-2xl bg-[#0F111C] border border-white/[0.04] animate-pulse" />
        
        {/* Section title */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>

        {/* Cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.04] bg-[#0F111C] overflow-hidden">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-3 w-16 rounded-full" />
                <Skeleton className="h-5 w-full rounded-lg" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20 rounded-full" />
                  <Skeleton className="h-3 w-12 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
