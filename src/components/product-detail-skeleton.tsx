function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-slate-400/15 motion-safe:animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export function ProductDetailSkeleton() {
  return (
    <main
      id="main-content"
      className="retail-storefront bg-retail-bg text-retail-primary"
      role="status"
      aria-label="در حال آماده‌سازی جزئیات محصول"
      aria-busy="true"
      data-testid="loading-product"
    >
      <span className="sr-only">در حال آماده‌سازی جزئیات محصول</span>
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-10">
        <SkeletonBlock className="mb-5 h-4 w-56 max-w-full" />
        <div className="retail-glass grid gap-6 rounded-[1.5rem] border border-white/10 bg-[#0D1117] p-3 shadow-retail-lg sm:p-5 lg:grid-cols-[minmax(0,1.03fr)_minmax(24rem,0.97fr)] lg:gap-7 lg:p-6">
          <div data-testid="loading-product-gallery" className="grid gap-3 lg:order-2">
            <SkeletonBlock className="aspect-[3/4] w-full !rounded-xl" />
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6">
              {[0, 1, 2, 3, 4].map((item) => (
                <SkeletonBlock key={item} className="aspect-[3/4] w-full !rounded-xl" />
              ))}
            </div>
          </div>
          <div
            data-testid="loading-product-info"
            className="grid content-start gap-5 rounded-xl border border-white/10 bg-[#0D1117] p-5 sm:p-6 lg:order-1"
          >
            <SkeletonBlock className="h-8 w-3/4" />
            <SkeletonBlock className="h-4 w-2/5" />
            <SkeletonBlock className="h-20 w-full" />
            <div className="grid grid-cols-3 gap-3">
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
            </div>
            <SkeletonBlock className="mt-2 h-7 w-40" />
            <SkeletonBlock className="h-12 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
