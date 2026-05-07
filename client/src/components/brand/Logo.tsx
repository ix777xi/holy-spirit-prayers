import flameDoveLogo from "@/assets/flame-dove-logo.jpg";

type Size = "sm" | "md" | "lg";
type Orientation = "horizontal" | "stacked";

const sizes: Record<Size, { box: number; text: string }> = {
  sm: { box: 40, text: "text-sm" },
  md: { box: 36, text: "text-xl" },
  lg: { box: 108, text: "text-3xl" },
};

/**
 * Holy Spirit Prayers logo — user-provided flame and dove artwork.
 */
export function LogoMark({ size = 28, title = "Holy Spirit Prayers" }: { size?: number; title?: string }) {
  return (
    <img
      src={flameDoveLogo}
      alt={title}
      width={size}
      height={size}
      className="block rounded-lg object-cover shadow-sm"
      style={{ width: size, height: size }}
      data-testid="img-logo-mark"
    />
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
