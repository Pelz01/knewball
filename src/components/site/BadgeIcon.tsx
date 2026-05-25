interface BadgeIconProps {
  id: string;
  className?: string;
}

export function BadgeIcon({ id, className = "h-8 w-8" }: BadgeIconProps) {
  // Generate unique IDs for SVG gradients to prevent collisions when multiple icons are rendered on a page
  const gradId = `icon-grad-${id}`;
  const gradLightId = `icon-grad-light-${id}`;
  const bgGlowId = `icon-bg-glow-${id}`;

  let svgContent: React.ReactNode;

  switch (id) {
    case "first-call":
      // Cybernetic Envelope with target lock
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <path d="M12 18H52C54.2 18 56 19.8 56 22V42C56 44.2 54.2 46 52 46H12C9.8 46 8 44.2 8 42V22C8 19.8 9.8 18 12 18Z" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M8 22L32 35L56 22" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M32 30L34 26L32 30L38 30L32 30L30 34L32 30L26 30L32 30Z" stroke={`url(#${gradLightId})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
      break;

    case "knew-ball":
      // Bullseye Football Radar
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <circle cx="32" cy="32" r="22" stroke={`url(#${gradId})`} strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="32" cy="32" r="15" stroke={`url(#${gradLightId})`} strokeWidth="2" />
          <path d="M32 4V10M32 54V60M4 32H10M54 32H60" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="32" r="7" stroke={`url(#${gradLightId})`} strokeWidth="2" fill={`url(#${gradId})`} fillOpacity="0.2" />
          <path d="M32 25L34 29H30L32 25Z" fill={`url(#${gradLightId})`} />
          <path d="M32 39L34 35H30L32 39Z" fill={`url(#${gradLightId})`} />
        </svg>
      );
      break;

    case "strong-call":
      // Precision Strike / Pierced Target
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <circle cx="32" cy="32" r="20" stroke={`url(#${gradId})`} strokeWidth="2.5" />
          <circle cx="32" cy="32" r="12" stroke={`url(#${gradId})`} strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M14 50L46 18" stroke={`url(#${gradLightId})`} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M34 18H46V30" stroke={`url(#${gradLightId})`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
      break;

    case "sharp-call":
      // Nova Diamond Sparkle
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <path d="M32 10L37 27L54 32L37 37L32 54L27 37L10 32L27 27L32 10Z" fill={`url(#${gradId})`} fillOpacity="0.2" stroke={`url(#${gradLightId})`} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M48 16L49.5 21L54 22L49.5 23L48 28L46.5 23L42 22L46.5 21L48 16Z" fill={`url(#${gradLightId})`} />
          <path d="M16 40L17.5 45L22 46L17.5 47L16 52L14.5 47L10 46L14.5 45L16 40Z" fill={`url(#${gradLightId})`} />
        </svg>
      );
      break;

    case "perfect-slate":
      // Masterclass Winged Trophy
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <path d="M16 16H48V28C48 36.8 40.8 44 32 44C23.2 44 16 36.8 16 28V16Z" fill={`url(#${gradId})`} fillOpacity="0.2" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M16 20H10C7.8 20 6 21.8 6 24V28C6 31.3 8.7 34 12 34H16" stroke={`url(#${gradLightId})`} strokeWidth="2" strokeLinecap="round" />
          <path d="M48 20H54C56.2 20 58 21.8 58 24V28C58 31.3 55.3 34 52 34H48" stroke={`url(#${gradLightId})`} strokeWidth="2" strokeLinecap="round" />
          <path d="M32 44V52" stroke={`url(#${gradId})`} strokeWidth="3" />
          <path d="M20 54H44" stroke={`url(#${gradLightId})`} strokeWidth="4" strokeLinecap="round" />
          <path d="M32 23L33.5 27.5H38L34.5 30L36 34.5L32 32L28 34.5L29.5 30L26 27.5H30.5L32 23Z" fill={`url(#${gradLightId})`} />
        </svg>
      );
      break;

    case "score-prophet":
      // Crystal Prediction Orb
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <path d="M22 48C22 44 26 42 32 42C38 42 42 44 42 48" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 52H46" stroke={`url(#${gradLightId})`} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="32" cy="26" r="16" fill={`url(#${gradId})`} fillOpacity="0.25" stroke={`url(#${gradLightId})`} strokeWidth="2.5" />
          <path d="M32 16L33.5 20H37L34 22.5L35 26.5L32 24L29 26.5L30 22.5L27 20H30.5L32 16Z" fill={`url(#${gradLightId})`} />
          <circle cx="25" cy="30" r="1" fill="#fff" />
          <circle cx="39" cy="28" r="1.5" fill="#fff" />
        </svg>
      );
      break;

    case "first-blood":
      // Energized Lightning Bolt
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <path d="M18 14L32 8L46 14V32C46 41.5 40 49.5 32 54C24 49.5 18 41.5 18 32V14Z" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinejoin="round" opacity="0.3" />
          <path d="M38 12L20 32H32L26 52L44 32H32L38 12Z" fill={`url(#${gradId})`} stroke={`url(#${gradLightId})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
      break;

    case "in-form":
      // Current Form Flame
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <path d="M32 6C32 6 45 17 45 32C45 41 39 48 32 48C25 48 19 41 19 32C19 19 32 6 32 6Z" fill={`url(#${gradId})`} fillOpacity="0.2" />
          <path d="M32 14C32 14 41 23 41 34C41 40.5 37 45 32 45C27 45 23 40.5 23 34C23 27 32 14 32 14Z" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M32 25C32 25 36 30 36 36C36 39.5 34 41 32 41C30 41 28 39.5 28 36C28 33 32 25 32 25Z" fill={`url(#${gradLightId})`} />
        </svg>
      );
      break;

    case "upset-hunter":
      // Heavy Tactical Alert Crest
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <path d="M15 14L32 8L49 14V32C49 42.5 42 51.5 32 55.5C22 51.5 15 42.5 15 32V14Z" fill={`url(#${gradId})`} fillOpacity="0.15" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M32 18L42 35H22L32 18Z" stroke={`url(#${gradLightId})`} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M32 24V29" stroke={`url(#${gradLightId})`} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="32" r="1.5" fill={`url(#${gradLightId})`} />
        </svg>
      );
      break;

    case "chaos-merchant":
      // Orbital Infinite Helix
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <path d="M16 32C16 39 22 45 32 45C42 45 48 39 48 32C48 25 42 19 32 19C22 19 16 25 16 32Z" stroke={`url(#${gradId})`} strokeWidth="2" opacity="0.3" />
          <path d="M12 24C16 16 30 16 32 24C34 32 48 32 52 24" stroke={`url(#${gradLightId})`} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M54 20L52 24L48 22" stroke={`url(#${gradLightId})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 28L12 24L16 26" stroke={`url(#${gradLightId})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="24" r="3" fill={`url(#${gradLightId})`} />
        </svg>
      );
      break;

    case "country-captain":
      // Royal Crown
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <path d="M14 44L18 24L26 31L32 18L38 31L46 24L50 44H14Z" fill={`url(#${gradId})`} fillOpacity="0.2" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M12 44H52" stroke={`url(#${gradLightId})`} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M16 48H48" stroke={`url(#${gradLightId})`} strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="24" r="2" fill={`url(#${gradLightId})`} />
          <circle cx="32" cy="18" r="2.5" fill={`url(#${gradLightId})`} />
          <circle cx="46" cy="24" r="2" fill={`url(#${gradLightId})`} />
        </svg>
      );
      break;

    default:
      // Generic Trophy
      svgContent = (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="32" cy="32" r="24" fill={`url(#${bgGlowId})`} />
          <path d="M16 16H48V28C48 36.8 40.8 44 32 44C23.2 44 16 36.8 16 28V16Z" fill={`url(#${gradId})`} fillOpacity="0.2" stroke={`url(#${gradId})`} strokeWidth="2" strokeLinejoin="round" />
          <path d="M32 44V52" stroke={`url(#${gradId})`} strokeWidth="3" />
          <path d="M22 54H42" stroke={`url(#${gradLightId})`} strokeWidth="4" />
        </svg>
      );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-full p-[1.5px] bg-gradient-to-br from-primary/60 via-gold/40 to-border/50 shrink-0 shadow-[0_0_15px_rgba(25,227,111,0.12)] transition duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(25,227,111,0.22)] ${className}`}
    >
      {/* Decorative inner light reflection layer */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/5 via-transparent to-white/10 pointer-events-none" />

      {/* The main coin surface */}
      <div
        className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-b from-[#11151b] via-[#0d1015] to-[#07090c] p-[10%] relative overflow-hidden"
      >
        {/* Subtle inner concentric guide ring */}
        <div className="absolute inset-[3px] rounded-full border border-white/[0.03] pointer-events-none" />

        {/* Embedded gradients for SVG references */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#19e36f" />
              <stop offset="100%" stopColor="#e8dfc8" />
            </linearGradient>
            <linearGradient id={gradLightId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#52f396" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <radialGradient id={bgGlowId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#19e36f" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#19e36f" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {svgContent}
      </div>
    </div>
  );
}
