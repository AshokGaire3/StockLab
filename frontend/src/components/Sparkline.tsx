import React from 'react';

interface SparklineProps {
  data?: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  isPositive,
  width = 120,
  height = 36,
  className = '',
}) => {
  // If no historical points provided, create a smooth visual sparkline trajectory
  const points = React.useMemo(() => {
    if (data && data.length > 1) return data;
    
    // Generate synthetic smooth sparkline shape matching trend direction
    const count = 12;
    const result: number[] = [];
    let current = 100;
    result.push(current);
    
    const targetDelta = isPositive ? 8 : -8;
    const step = targetDelta / count;
    
    for (let i = 1; i < count - 1; i++) {
      const noise = (Math.random() - 0.45) * 4;
      current += step + noise;
      result.push(current);
    }
    result.push(100 + targetDelta);
    return result;
  }, [data, isPositive]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;

  // Map points to SVG coordinates
  const svgPoints = points
    .map((val, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#10B981' : '#F43F5E';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
  const gradientId = React.useId();

  // Create closed path for area fill under sparkline
  const firstPoint = `${0},${height}`;
  const lastPoint = `${width},${height}`;
  const areaPath = `M 0,${height} L ${svgPoints} L ${width},${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      className={`overflow-visible ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={svgPoints}
      />
    </svg>
  );
};
