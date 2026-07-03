import mascotUrl from '../assets/mascot.webp';

interface MascotProps {
  /** rendered height in px (width follows the art's aspect ratio). */
  size?: number;
  className?: string;
}

// The app's friendly owl mascot (bundled PNG, so it works offline). Used on
// onboarding, empty states, and the savings card.
export function Mascot({ size = 96, className = '' }: MascotProps) {
  return (
    <img
      src={mascotUrl}
      alt=""
      aria-hidden
      height={size}
      style={{ height: size, width: 'auto' }}
      className={className}
      draggable={false}
    />
  );
}
