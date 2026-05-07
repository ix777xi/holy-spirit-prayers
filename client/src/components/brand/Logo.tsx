type Size = "sm" | "md" | "lg";

const sizes: Record<Size, { box: number; text: string }> = {
  sm: { box: 28, text: "text-lg" },
  md: { box: 36, text: "text-xl" },
  lg: { box: 56, text: "text-3xl" },
};

/**
 * Holy Spirit Prayers logo — a stained-glass dove + flame mark.
 * Uses currentColor so it adapts to text color contexts.
 */
export function LogoMark({ size = 28, title = "Holy Spirit Prayers" }: { size?: number; title?: string }) {
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hsp-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1B2A4A" />
          <stop offset="100%" stopColor="#7BA7BC" />
        </linearGradient>
        <radialGradient id="hsp-halo" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#E0C783" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Stained-glass shield */}
      <path
        d="M32 4 L56 14 V32 C56 47 45 56 32 60 C19 56 8 47 8 32 V14 Z"
        fill="url(#hsp-glass)"
        stroke="#C9A84C"
        strokeWidth="1.5"
      />
      {/* Halo glow */}
      <circle cx="32" cy="26" r="16" fill="url(#hsp-halo)" />
      {/* Dove silhouette */}
      <path
        d="M22 32 Q26 24 32 24 Q40 24 44 30 Q40 32 36 30 Q34 36 28 36 Q24 36 22 32 Z"
        fill="#FDF8F0"
      />
      {/* Wing line */}
      <path
        d="M32 24 Q36 20 42 22"
        stroke="#FDF8F0"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Flame above */}
      <path
        d="M32 6 Q35 11 32 16 Q29 11 32 6 Z"
        fill="#C9A84C"
      />
      {/* Cross at base */}
      <path
        d="M32 42 V52 M28 46 H36"
        stroke="#C9A84C"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ size = "md", subtitle = false }: { size?: Size; subtitle?: boolean }) {
  const s = sizes[size];
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={s.box} />
      <div className="leading-tight">
        <div className={`headline ${s.text} font-semibold tracking-tight`} data-testid="text-brand">
          Holy Spirit Prayers
        </div>
        {subtitle ? (
          <div className="text-xs text-muted-foreground italic font-serif">
            Spirit-led prayers rooted in Scripture.
          </div>
        ) : null}
      </div>
    </div>
  );
}
