import React from 'react';
import { useCurrentFrame } from 'remotion';

/* The site's pencil line (travel-directory hero): fractal noise displacing the stroke. The seed
   changes a few times a second so the line shivers like a hand drawing, as on the site. */
export const PencilFilter: React.FC<{ id: string; scale?: number; frequency?: number }> = ({ id, scale = 3, frequency = 0.04 }) => {
  const frame = useCurrentFrame();
  const seed = 1 + (Math.floor(frame / 5) * 37) % 90;
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={2} seed={seed} result="grain" />
      <feDisplacementMap in="SourceGraphic" in2="grain" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
};
