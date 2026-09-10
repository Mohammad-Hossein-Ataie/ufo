type Kind = "cart" | "checkout" | "order";

function Block({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-slate-400/15 motion-safe:animate-pulse ${className}`} />;
}

function Summary() {
  return (
    <div className="h-fit rounded-2xl border border-slate-400/15 bg-slate-400/5 p-5">
      <Block className="mb-7 h-5 w-28" />
      <div className="grid gap-5">
        {[0, 1, 2].map((n) => (
          <div key={n} className="flex justify-between gap-4">
            <Block className="h-3 w-20" />
            <Block className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="my-5 border-t border-slate-400/15" />
      <Block className="mb-5 h-7 w-40 max-w-full" />
      <Block className="h-12 w-full" />
    </div>
  );
}

export function CommerceSkeleton({ kind, page = false }: { kind: Kind; page?: boolean }) {
  const label = {
    cart: "در حال دریافت سبد خرید",
    checkout: "در حال آماده‌سازی تسویه حساب",
    order: "در حال دریافت جزئیات سفارش",
  }[kind];
  const content = (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      data-testid={`loading-${kind}`}
      className="min-w-0"
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        {(page || kind === "order") && (
          <div className="mb-7 grid gap-3">
            <Block className="h-8 w-60 max-w-full" />
            <Block className="h-4 w-40" />
          </div>
        )}
        {kind === "checkout" && <Block className="mb-5 h-14 w-full !rounded-2xl" />}
        <div
          className={`grid items-start gap-5 ${kind === "checkout" ? "lg:grid-cols-[minmax(0,1fr)_23rem]" : "lg:grid-cols-[minmax(0,1fr)_22rem]"}`}
        >
          <div className="grid min-w-0 gap-5">
            {kind === "cart" ? (
              [0, 1, 2].map((n) => (
                <div
                  key={n}
                  className="flex gap-4 rounded-2xl border border-slate-400/15 bg-slate-400/5 p-4"
                >
                  <Block className="h-24 w-20 shrink-0 sm:w-24" />
                  <div className="grid min-w-0 flex-1 content-center gap-4">
                    <Block className="h-4 w-3/4" />
                    <Block className="h-3 w-1/2" />
                    <div className="flex justify-between gap-4">
                      <Block className="h-8 w-20" />
                      <Block className="h-5 w-24" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="grid gap-4 rounded-2xl border border-slate-400/15 bg-slate-400/5 p-5">
                  <Block className="mb-2 h-5 w-32" />
                  {[0, 1, 2].map((n) => (
                    <Block key={n} className="h-[76px] w-full !rounded-xl" />
                  ))}
                </div>
                <div className="grid gap-4 rounded-2xl border border-slate-400/15 bg-slate-400/5 p-5">
                  <Block className="h-5 w-36" />
                  <div className="grid grid-cols-2 gap-3">
                    <Block className="h-12" />
                    <Block className="h-12" />
                  </div>
                  <Block className={kind === "order" ? "h-48" : "h-28"} />
                  <Block className="h-12" />
                </div>
              </>
            )}
          </div>
          <Summary />
        </div>
      </div>
    </div>
  );
  return page ? (
    <main className={`mx-auto px-4 py-10 ${kind === "cart" ? "max-w-7xl" : "max-w-6xl"}`}>
      {content}
    </main>
  ) : (
    content
  );
}
