import React, { useMemo } from 'react';
import { C } from '../brand';
import { tangle, toD } from './rope';

export type Seg = { kind: 'main' | 'slack'; d: string };

const svgPath = (d: string) => {
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d);
  return p;
};

/* A strand of yarn drawn up to `progress` (0–1) along a list of segments, in the caller's
   coordinates. Main runs are a thick strand with a darker twist running through it; slack runs
   are a thin, faint thread. The ball rides the tip, turning, and shrinks as it pays out.
   (Measuring paths needs the browser, which is where Remotion renders.) */
export const YarnStrand: React.FC<{
  id: string;
  segs: Seg[];
  progress: number;
  width: number;
  frame: number;
  color?: string;
  twist?: string;
  ball?: boolean;
  ballSize?: number;
  filter?: string;
}> = ({ id, segs, progress, width, frame, color = C.yellow, twist = '#b98b12', ball = true, ballSize = 1, filter }) => {
  const lengths = useMemo(() => segs.map(s => svgPath(s.d).getTotalLength()), [segs]);
  const total = lengths.reduce((a, b) => a + b, 0);
  let before = 0;
  let tip: DOMPoint | null = null;
  const runs = segs.map((s, i) => {
    const drawn = Math.max(0, Math.min(lengths[i], progress * total - before));
    before += lengths[i];
    if (drawn > 0) tip = svgPath(s.d).getPointAtLength(drawn);
    return { ...s, drawn, length: lengths[i] };
  });
  const r = width * 2.4 * ballSize * (1 - progress * 0.5);
  const at = tip as DOMPoint | null;
  return (
    <g filter={filter}>
      {runs.map((run, i) => {
        if (run.drawn <= 0) return null;
        const dash = `${run.drawn} ${run.length + 10}`;
        if (run.kind === 'slack') {
          return <path key={i} d={run.d} fill="none" stroke={color} strokeWidth={width * 0.28} opacity={0.6} strokeLinecap="round" strokeDasharray={dash} />;
        }
        const maskId = `${id}-m${i}`;
        return (
          <g key={i}>
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <path d={run.d} fill="none" stroke="#fff" strokeWidth={width * 1.2} strokeLinecap="round" strokeDasharray={dash} />
            </mask>
            <path d={run.d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
            {/* The twist: short diagonal-looking dashes travelling along the strand. */}
            <path d={run.d} fill="none" stroke={twist} strokeWidth={width * 0.2} strokeLinecap="round" opacity={0.55}
              strokeDasharray={`${width * 0.8} ${width * 0.9}`} strokeDashoffset={-frame * width * 0.12} mask={`url(#${maskId})`} />
          </g>
        );
      })}
      {ball && at && progress < 1 && (
        <g transform={`translate(${at.x} ${at.y}) rotate(${frame * 11})`}>
          <circle r={r} fill={color} />
          <path d={toD(tangle(180, 0, 0, r * 0.9, 0.61))} fill="none" stroke={twist} strokeWidth={width * 0.16} opacity={0.85} />
        </g>
      )}
    </g>
  );
};
