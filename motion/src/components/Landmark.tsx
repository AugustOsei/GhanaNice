import React, { useMemo } from 'react';
import { TRACES } from '../data/generated';
import { C } from '../brand';

type Name = keyof typeof TRACES;

/* Bounding box of a path's coordinates (the traces are plain M/L/Z polylines). */
function bounds(d: string) {
  const n = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
  const xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2 === 1);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/* A landmark traced from the site's photo, drawn as pencil line. `draw` (0–1) reveals the
   outline first, then the inside details; `fill` floods the shapes that are solid in reality
   (Larabanga's dark plinth, its door, timbers and openings). */
export const Landmark: React.FC<{
  name: Name;
  width: number;
  draw?: number;
  fill?: number;
  stroke?: string;
  strokeWidth?: number;
  filter?: string;
  pad?: number;
}> = ({ name, width, draw = 1, fill = 1, stroke = C.ink, strokeWidth = 3, filter, pad = 12 }) => {
  const t = TRACES[name] as Record<string, string | number>;
  const box = useMemo(() => bounds(String(t.outline)), [t]);
  const vw = box.x1 - box.x0 + pad * 2;
  const vh = box.y1 - box.y0 + pad * 2;
  const height = (width * vh) / vw;
  const part = (from: number, to: number) => Math.min(1, Math.max(0, (draw - from) / (to - from)));
  const line = (d: string, progress: number, extra: React.SVGProps<SVGPathElement> = {}) => (
    <path d={d} pathLength={1} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray="1 1" strokeDashoffset={1 - progress} vectorEffect="non-scaling-stroke" {...extra} />
  );
  const details = String(t.details || '').split(/(?=M)/).filter(Boolean);
  const plinth = String(t.plinth || '').split(/(?=M)/).filter(Boolean);
  /* Larabanga stands on a dark mud plinth: fill the outline below the traced plinth line. */
  const plinthY = useMemo(() => {
    const ys = (String(t.plinth || '').match(/-?\d+(\.\d+)?/g) || []).map(Number).filter((_, i) => i % 2 === 1);
    return ys.length ? ys.reduce((s, y) => s + y, 0) / ys.length : null;
  }, [t]);
  const clipId = `clip-${name}`;
  return (
    <svg width={width} height={height} viewBox={`${box.x0 - pad} ${box.y0 - pad} ${vw} ${vh}`} style={{ overflow: 'visible' }}>
      <defs><clipPath id={clipId}><path d={String(t.outline)} /></clipPath></defs>
      {name === 'larabanga' && plinthY ? (
        <rect x={box.x0} y={plinthY} width={box.x1 - box.x0} height={box.y1 - plinthY} fill={C.ink} opacity={fill} clipPath={`url(#${clipId})`} />
      ) : null}
      <g filter={filter}>
        {line(String(t.outline), part(0, 0.55))}
        {t.door ? <path d={String(t.door)} fill={C.ink} opacity={fill} /> : null}
        {plinth.map((d, i) => <React.Fragment key={`p${i}`}>{line(d.replace(/ Z$/, ''), part(0.45, 0.7))}</React.Fragment>)}
        {details.map((d, i) => (
          <path key={i} d={d} fill={C.ink} fillOpacity={fill}
            stroke={stroke} strokeWidth={strokeWidth * 0.7} vectorEffect="non-scaling-stroke" strokeLinejoin="round"
            opacity={part(0.55 + (i / details.length) * 0.35, 0.6 + (i / details.length) * 0.4)} />
        ))}
      </g>
    </svg>
  );
};

/* Where the landmark's source photo sits relative to the drawing's top-left corner, when the
   drawing is `width` wide: the trace came from this photo, so they line up exactly. */
export const photoUnder = (name: Name, width: number, pad = 12) => {
  const t = TRACES[name] as unknown as Record<string, string | number>;
  const b = bounds(String(t.outline));
  const scale = width / (b.x1 - b.x0 + pad * 2);
  return { left: -(b.x0 - pad) * scale, top: -(b.y0 - pad) * scale, width: Number(t.width) * scale, height: Number(t.height) * scale };
};
