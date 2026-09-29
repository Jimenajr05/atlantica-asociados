interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  asideValue?: string;
  asideLabel?: string;
}

export function PageHero({
  eyebrow,
  title,
  description,
  asideValue,
  asideLabel,
}: PageHeroProps) {
  return (
    <section className="bg-[#0b1522] text-white border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] items-center gap-8">
        <div className="max-w-3xl py-10 sm:py-14 lg:py-20 space-y-5">
          <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-dorado">
            <span className="w-8 h-px bg-dorado" aria-hidden="true" />
            {eyebrow}
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold leading-tight">
            {title}
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
            {description}
          </p>
        </div>
        {asideValue && asideLabel && (
          <div className="hidden lg:block border-l border-white/15 pl-8 pr-4 py-3">
            <span className="block font-serif text-5xl font-bold text-dorado">
              {asideValue}
            </span>
            <span className="mt-1 block text-xs font-semibold uppercase text-slate-300">
              {asideLabel}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}