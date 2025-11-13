export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button Skeleton */}
        <div className="mb-6 flex items-center gap-2">
          <div className="w-20 h-6 bg-muted animate-pulse rounded" />
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Skeleton */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-muted animate-pulse rounded-lg" />
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="relative aspect-square bg-muted animate-pulse rounded-md"
                />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <div className="h-10 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <div className="h-10 bg-muted animate-pulse rounded w-24" />
              <div className="h-8 bg-muted animate-pulse rounded w-20" />
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
              <div className="h-6 bg-muted animate-pulse rounded w-32" />
            </div>

            {/* Quantity & Button */}
            <div className="space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded w-40" />
              <div className="h-12 bg-muted animate-pulse rounded w-full" />
            </div>

            {/* Description */}
            <div className="pt-6 border-t border-border space-y-2">
              <div className="h-6 bg-muted animate-pulse rounded w-32" />
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
