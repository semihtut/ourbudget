interface SparklineProps {
  // One value per month, oldest first (cents). Drawn as a glowing gradient line.
  series: number[];
  className?: string;
}

// A soft, glowing gradient area+line meant to sit *behind* the hero content.
// Pure SVG (no chart lib) so it can bleed to the panel edges and glow freely.
export function Sparkline({ series, className }: SparklineProps) {
  const width = 100;
  const height = 40;

  if (series.length < 2) return null;

  const max = Math.max(...series, 1);
  const min = Math.min(...series, 0);
  const span = max - min || 1;
  const stepX = width / (series.length - 1);

  // Map values to points (invert Y; keep a little headroom top/bottom).
  const points = series.map((value, index) => {
    const x = index * stepX;
    const y = height - 4 - ((value - min) / span) * (height - 10);
    return { x, y };
  });

  // Smooth path with Catmull-Rom -> cubic bezier for a premium curve.
  const linePath = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x},${point.y}`;
      const prev = points[index - 1]!;
      const cpx = (prev.x + point.x) / 2;
      return `C ${cpx},${prev.y} ${cpx},${point.y} ${point.x},${point.y}`;
    })
    .join(' ');

  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2F6F5E" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#2F6F5E" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="spark-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5B8C7B" />
          <stop offset="60%" stopColor="#2F6F5E" />
          <stop offset="100%" stopColor="#D9A441" />
        </linearGradient>
        <filter id="spark-glow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={areaPath} fill="url(#spark-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke="url(#spark-line)"
        strokeWidth="1.6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        filter="url(#spark-glow)"
      />
    </svg>
  );
}
