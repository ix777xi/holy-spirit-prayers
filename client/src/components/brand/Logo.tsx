type Size = "sm" | "md" | "lg";
type Orientation = "horizontal" | "stacked";

const sizes: Record<Size, { box: number; text: string }> = {
  sm: { box: 34, text: "text-sm" },
  md: { box: 36, text: "text-xl" },
  lg: { box: 64, text: "text-3xl" },
};

/**
 * Holy Spirit Prayers logo — one flame with a dove cutout.
 * The mark is intentionally monochrome so it fits the black/white brand system.
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
      {/* Flame */}
      <path
        d="M33.3 4.8c1.2 8.5 8.5 13.3 12.8 20.1 3.3 5.2 4.3 10.6 2.7 16.1-2.4 8.3-9.7 14.2-18 14.2-8.9 0-16.4-6.5-18.1-15.3-1.5-7.5 2-14.9 7.4-20.6 3.3-3.5 7.4-6.9 8.1-12.1.2-1.4 1.8-2.1 3.1-1.4.9.5 1.6 1.5 2 3Z"
        fill="currentColor"
      />
      {/* Dove cutout */}
      <path
        d="M17.8 35.5c5.1-7.1 11.7-10.5 19.8-10.2 3.5.1 6.8 1 9.8 2.8-3.4 1.1-6.4 1.6-9.1 1.4-2.5-.1-4.8-.7-6.9-1.8-1 3.8-3 6.9-6 9.1-2.6 2-5.2 2.8-7.6 2.5-1.2-.1-1.7-1.4-1-2.4.3-.5.7-.9 1-1.4Z"
        fill="hsl(var(--background))"
      />
      <path
        d="M26.8 28.6c3.4 1.4 6.3 1.7 8.7.9"
        stroke="hsl(var(--background))"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  size = "md",
  subtitle = false,
  orientation = "horizontal",
}: {
  size?: Size;
  subtitle?: boolean;
  orientation?: Orientation;
}) {
  const s = sizes[size];
  const stacked = orientation === "stacked";
  return (
    <div className={stacked ? "flex flex-col items-center gap-1 text-center" : "flex items-center gap-3"}>
      <LogoMark size={s.box} />
      <div className="leading-tight">
        <div className={`headline ${s.text} font-semibold tracking-tight ${stacked ? "leading-none" : ""}`} data-testid="text-brand">
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
