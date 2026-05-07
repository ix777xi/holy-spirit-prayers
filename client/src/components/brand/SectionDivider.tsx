/** Gold line with small dove/flame icon — used between sections. */
export function SectionDivider({ icon = "dove" }: { icon?: "dove" | "flame" | "cross" }) {
  return (
    <div className="flex items-center gap-4 w-full" aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-brand-gold/50 to-brand-gold/30" />
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-brand-gold">
        {icon === "dove" && (
          <path d="M3 13c2-3 6-3 9-1 3 2 5 1 8 1-2 3-5 4-9 4-4 0-7-1-8-4z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" />
        )}
        {icon === "flame" && (
          <path d="M12 3c2 3 4 5 4 8a4 4 0 1 1-8 0c0-2 2-3 4-8z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" />
        )}
        {icon === "cross" && (
          <path d="M12 3v18M6 9h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        )}
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-brand-gold/50 to-brand-gold/30" />
    </div>
  );
}
