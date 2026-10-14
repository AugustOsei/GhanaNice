import React from 'react';

/* The favicon's star (dist/favicon.svg), without its tile. */
export const STAR_D = 'M32 9l5.6 14.8 15.8.8-12.3 9.9 4.1 15.3L32 41.2 18.8 50l4.1-15.3-12.3-9.9 15.8-.8z';
export const Star: React.FC<{ size: number; color: string; style?: React.CSSProperties }> = ({ size, color, style }) => (
  <svg width={size} height={size} viewBox="9 7 46 45" style={style}><path d={STAR_D} fill={color} /></svg>
);
