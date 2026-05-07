import { Prayer } from "@/lib/data";

/**
 * Generative, stained-glass-inspired artwork for each prayer.
 * No remote image dependency — pure SVG + CSS.
 */
export function PrayerArt({
  prayer,
  className = "",
  rounded = "rounded-xl",
}: {
  prayer: Prayer;
  className?: string;
  rounded?: string;
}) {
  const { from, to, accent, motif } = prayer.art;
  const id = `art-${prayer.id}`;
  return (
    <div
      className={`art-glass ${rounded} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`${id}-halo`} cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-ray`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Halo */}
        <circle cx="100" cy="80" r="80" fill={`url(#${id}-halo)`} />
        {/* Stained-glass triangulation lines */}
        <g stroke={accent} strokeOpacity="0.25" strokeWidth="0.6" fill="none">
          <path d="M0 60 L200 80" />
          <path d="M0 110 L200 130" />
          <path d="M40 0 L80 200" />
          <path d="M120 0 L160 200" />
        </g>
        {/* Light rays */}
        {motif === "rays" && (
          <g>
            <polygon points="100,30 90,180 110,180" fill={`url(#${id}-ray)`} opacity="0.7" />
            <polygon points="100,30 60,180 80,180" fill={`url(#${id}-ray)`} opacity="0.5" />
            <polygon points="100,30 120,180 140,180" fill={`url(#${id}-ray)`} opacity="0.5" />
          </g>
        )}
        {motif === "dove" && (
          <g>
            <path
              d="M60 110 Q80 80 110 88 Q140 92 145 110 Q130 116 115 108 Q108 130 88 130 Q70 128 60 110 Z"
              fill="#FDF8F0"
              opacity="0.95"
            />
            <path d="M110 88 Q125 76 145 80" stroke="#FDF8F0" strokeWidth="2" fill="none" opacity="0.9" />
            <circle cx="138" cy="106" r="2" fill={accent} />
          </g>
        )}
        {motif === "flame" && (
          <g>
            <path
              d="M100 50 Q124 78 110 110 Q130 96 124 132 Q116 168 96 168 Q72 168 70 134 Q66 110 86 100 Q74 80 100 50 Z"
              fill={accent}
              opacity="0.85"
            />
            <path d="M100 80 Q112 100 100 130 Q88 110 100 80 Z" fill="#FDF8F0" opacity="0.6" />
          </g>
        )}
        {motif === "cross" && (
          <g stroke={accent} strokeWidth="6" strokeLinecap="round">
            <line x1="100" y1="56" x2="100" y2="158" />
            <line x1="74" y1="92" x2="126" y2="92" />
          </g>
        )}
        {motif === "olive" && (
          <g>
            <path d="M52 130 Q90 70 150 80" stroke={accent} strokeWidth="2" fill="none" opacity="0.7" />
            <ellipse cx="80" cy="108" rx="9" ry="4" fill="#FDF8F0" opacity="0.85" transform="rotate(-30 80 108)" />
            <ellipse cx="100" cy="96" rx="9" ry="4" fill="#FDF8F0" opacity="0.85" transform="rotate(-25 100 96)" />
            <ellipse cx="120" cy="88" rx="9" ry="4" fill="#FDF8F0" opacity="0.85" transform="rotate(-20 120 88)" />
            <ellipse cx="140" cy="84" rx="9" ry="4" fill="#FDF8F0" opacity="0.85" transform="rotate(-15 140 84)" />
          </g>
        )}
        {/* Soft border highlight */}
        <rect x="0" y="0" width="200" height="200" fill="none" stroke="#FDF8F0" strokeOpacity="0.18" />
      </svg>
    </div>
  );
}
