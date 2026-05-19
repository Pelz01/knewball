type LogoProps = {
  className?: string;
  size?: number;
};

/**
 * KnewBall mark — angular K monogram nested inside a hexagonal
 * football panel. Pure SVG, currentColor for the K, primary token
 * for the panel accent.
 */
export function Logo({ className, size = 28 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* hex panel */}
      <path
        d="M20 2.5 34.16 10.75 V29.25 L20 37.5 5.84 29.25 V10.75 Z"
        stroke="var(--primary)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* inner ring */}
      <path
        d="M20 7 29.5 12.5 V27.5 L20 33 10.5 27.5 V12.5 Z"
        stroke="var(--primary)"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* K monogram */}
      <path
        d="M15 12 V28 M15 20 L24 12 M15 20 L24 28"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* corner pip */}
      <circle cx="29.5" cy="12.5" r="1.4" fill="var(--gold)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      KNEW<span className="text-primary">BALL</span>
    </span>
  );
}