// v1.2.0
// Reusable Speech logo badge. Renders the Lucide Speech icon as inline SVG
// inside a rounded teal square. The two arc paths animate with a staggered
// opacity wave; animation is suppressed via CSS when prefers-reduced-motion
// is active (keyframes live in globals.css).
//
// Layout: icon is bottom-aligned so the neck/body bleeds into the badge edge.
// A clipPath on the badge rect gives a clean clip with no bottom border line.
// An explicit head circle (white fill + thin teal stroke) makes the head read
// distinctly from the body mass.

type Size = 'sm' | 'md' | 'lg';
type Variant = 'light' | 'dark';

interface SpeechLogoProps {
  size?: Size;
  variant?: Variant;
  className?: string;
}

const SIZE_MAP: Record<Size, { badge: number; icon: number; radius: number; bottomPad: number }> = {
  sm: { badge: 32, icon: 26, radius: 7,  bottomPad: 2 },
  md: { badge: 44, icon: 36, radius: 9,  bottomPad: 2 },
  lg: { badge: 58, icon: 48, radius: 12, bottomPad: 3 },
};

export function SpeechLogo({ size = 'md', variant: _variant = 'light', className }: SpeechLogoProps) {
  const { badge, icon, radius, bottomPad } = SIZE_MAP[size];

  // Horizontal: centre. Vertical: bottom-align so figure anchors to badge edge.
  const xOffset = (badge - icon) / 2;
  const yOffset = badge - icon - bottomPad;

  // Unique clip id per size avoids collisions when multiple sizes render on one page.
  const clipId = `speech-badge-clip-${size}`;

  return (
    <svg
      width={badge}
      height={badge}
      viewBox={`0 0 ${badge} ${badge}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/* Clip to the badge shape so the body fill bleeds cleanly to the edge
            with no visible bottom line or border artifact. */}
        <clipPath id={clipId}>
          <rect width={badge} height={badge} rx={radius} />
        </clipPath>
      </defs>

      {/* Teal badge background */}
      <rect width={badge} height={badge} rx={radius} fill="#14B8A6" />

      {/* Icon -- clipped to badge bounds */}
      <g clipPath={`url(#${clipId})`}>
        <svg
          x={xOffset}
          y={yOffset}
          width={icon}
          height={icon}
          viewBox="0 0 24 24"
          fill="none"
        >
          {/* Body / torso -- fill only (no stroke) so the clipPath edge is
              invisible. Extended to y=30 so the fill bleeds well past the
              viewBox; the clipPath does the clean cut at the badge boundary. */}
          <path
            d="M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.054 1 4.55a5.77 5.77 0 0 1 .029 2.758L2 30H8.8Z"
            fill="white"
          />

          {/* Head circle -- explicit circle makes the head read as a distinct
              round head rather than merging into the body shape. The thin teal
              stroke shows the head boundary against the white body mass. */}
          <circle
            cx="6.8"
            cy="5.8"
            r="3.2"
            fill="white"
            stroke="#14B8A6"
            strokeWidth="0.75"
          />

          {/* Inner arc -- animates first (no delay) */}
          <path
            d="M17 15a3.5 3.5 0 0 0-.025-4.975"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-speech-arc-inner"
          />

          {/* Outer arc -- animates second (0.25s stagger) */}
          <path
            d="M19.8 17.8a7.5 7.5 0 0 0 .003-10.603"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-speech-arc-outer"
          />
        </svg>
      </g>
    </svg>
  );
}
