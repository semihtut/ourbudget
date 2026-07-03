interface MascotProps {
  /** rendered width/height in px. */
  size?: number;
  className?: string;
}

// The app's friendly red-panda mascot. Pure inline SVG so it works offline and
// scales crisply everywhere (onboarding, empty states, savings card).
export function Mascot({ size = 96, className = '' }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      className={className}
    >
      {/* ears */}
      <path d="M22 38 L14 14 L42 24 Z" fill="#E2582A" />
      <path d="M98 38 L106 14 L78 24 Z" fill="#E2582A" />
      <path d="M24 33 L19 19 L37 26 Z" fill="#FFD9C7" />
      <path d="M96 33 L101 19 L83 26 Z" fill="#FFD9C7" />
      {/* head */}
      <circle cx="60" cy="62" r="42" fill="#F4763B" />
      {/* white cheek + muzzle patches */}
      <ellipse cx="38" cy="72" rx="16" ry="18" fill="#FFF4EC" />
      <ellipse cx="82" cy="72" rx="16" ry="18" fill="#FFF4EC" />
      <ellipse cx="60" cy="82" rx="20" ry="16" fill="#FFF4EC" />
      {/* brow patches */}
      <ellipse cx="42" cy="42" rx="9" ry="7" fill="#FFF4EC" opacity="0.9" />
      <ellipse cx="78" cy="42" rx="9" ry="7" fill="#FFF4EC" opacity="0.9" />
      {/* happy closed eyes */}
      <path
        d="M34 58 Q41 50 48 58"
        stroke="#3E2723"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M72 58 Q79 50 86 58"
        stroke="#3E2723"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* blush */}
      <circle cx="34" cy="70" r="5.5" fill="#FFB199" />
      <circle cx="86" cy="70" r="5.5" fill="#FFB199" />
      {/* nose + smile */}
      <ellipse cx="60" cy="72" rx="6" ry="5" fill="#3E2723" />
      <path
        d="M52 84 Q60 92 68 84"
        stroke="#3E2723"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* a little coin it's holding */}
      <circle cx="60" cy="106" r="12" fill="#FFC94D" stroke="#E8A420" strokeWidth="3" />
      <text
        x="60"
        y="111"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fill="#B97E0B"
        fontFamily="Nunito, sans-serif"
      >
        €
      </text>
    </svg>
  );
}
