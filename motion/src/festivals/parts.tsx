import React from 'react';
import { Img, interpolate, staticFile } from 'remotion';
import { C, SANS, SERIF } from '../brand';

/* The festivals board's own pieces (dist/festivals/index.html), redrawn at film size: the green
   board with its grain, taped prints, paper cut-outs with a white cut edge, the split-flap tiles,
   and the newsletter card's atumpan drums (dist/newsletter.js). */

export const BOARD = '#145c41';
export const TAPE = 'rgba(241, 238, 229, .72)';
export const PRINT_PAPER = '#fbf9f3';
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .09 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
export const grain = (colour: string) => `${GRAIN}, ${colour}`;

/* The cut edge: the shape grown by a few pixels and filled with paper white, under the shape. */
export const CutDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <defs>
      <filter id="cut" x="-15%" y="-15%" width="130%" height="130%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="grow" />
        <feFlood floodColor="#fbf9f3" />
        <feComposite in2="grow" operator="in" result="edge" />
        <feMerge><feMergeNode in="edge" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  </svg>
);

/* A photo print with a strip of tape and a handwritten caption, as on the board. `drop` (0–1)
   brings it down onto the board: from larger and higher, settling with its shadow. */
export const Print: React.FC<{
  src: string; x: number; y: number; w: number; ratio: number; rotate: number; drop: number;
  place: string; credit: string; tape?: { left?: number; right?: number; w: number; r: number }; captionSize?: number;
}> = ({ src, x, y, w, ratio, rotate, drop, place, credit, tape = { right: 40, w: 180, r: 8 }, captionSize = 30 }) => {
  if (drop <= 0) return null;
  const lift = 1 - Math.min(1, drop);
  const pad = Math.round(w * 0.03);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, padding: `${pad}px ${pad}px 0`, background: PRINT_PAPER,
      opacity: Math.min(1, drop * 3),
      transform: `translateY(${-lift * 120}px) rotate(${rotate + lift * rotate * 2}deg) scale(${1 + lift * 0.25})`,
      boxShadow: `0 2px 2px rgba(0,0,0,.12), 0 ${34 + lift * 60}px ${50 + lift * 60}px -24px rgba(0,0,0,${0.6 - lift * 0.3})` }}>
      <div style={{ position: 'absolute', zIndex: 2, top: -18, height: 40, width: tape.w, left: tape.left, right: tape.right,
        background: TAPE, boxShadow: '0 1px 2px rgba(0,0,0,.1)', transform: `rotate(${tape.r}deg)` }} />
      <Img src={staticFile(src)} style={{ display: 'block', width: '100%', height: (w - pad * 2) / ratio, objectFit: 'cover' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, padding: `${pad * 0.8}px 4px ${pad}px`,
        fontFamily: SERIF, fontStyle: 'italic', fontSize: captionSize, lineHeight: 1.1, color: C.ink }}>
        <span>{place}</span>
        <small style={{ fontFamily: SANS, fontStyle: 'normal', fontSize: Math.max(15, captionSize * 0.55), color: 'rgba(17,17,15,.55)', whiteSpace: 'nowrap' }}>{credit}</small>
      </div>
    </div>
  );
};

/* The board's paper cut-outs, same drawings as the site. */
export const CUTOUTS: Record<string, React.ReactNode> = {
  drum: <>
    <path d="M64 62 L136 62 L124 186 L76 186Z" fill="#9c5a2c" />
    <path d="M66 82 L134 82 L133 92 L67 92Z M72 150 L128 150 L127 160 L73 160Z" fill="#df4a32" />
    <ellipse cx="100" cy="62" rx="36" ry="10" fill="#efe2c4" />
    <path d="M70 94 L82 148 L94 94 L106 148 L118 94 L130 148" fill="none" stroke="#3b2414" strokeWidth="3" />
    <path d="M164 14 L116 60 M36 14 L84 60" stroke="#6b4423" strokeWidth="7" strokeLinecap="round" />
  </>,
  umbrella: <>
    <path d="M100 43 L100 194" stroke="#5a3a1e" strokeWidth="6" strokeLinecap="round" />
    <path d="M38 104 Q100 16 164 104Z" fill="#df4a32" />
    <path d="M38 104 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0 q7 13 14 0Z" fill="#f5c842" />
    <path d="M58 80 Q100 40 144 80" stroke="#f5c842" strokeWidth="6" fill="none" />
    <circle cx="100" cy="36" r="8" fill="#f5c842" />
  </>,
  cocoa: <>
    <path d="M108 38 C128 16 164 14 184 24 C164 42 132 48 108 38Z" fill="#5c8a3a" />
    <path d="M100 36 C142 46 152 122 104 178 C56 122 62 46 100 36Z" fill="#e09a2c" />
    <path d="M100 40 C80 80 82 140 104 176 M100 40 C120 80 122 140 104 176" fill="none" stroke="#b46a14" strokeWidth="3" />
  </>,
  bowl: <>
    <path d="M36 112 Q100 196 164 112Z" fill="#c8913a" />
    <path d="M50 112 C56 66 144 66 150 112Z" fill="#f2dc8f" />
    <path d="M44 138 Q100 150 156 138" stroke="#9a6a24" strokeWidth="4" fill="none" />
    <ellipse cx="100" cy="112" rx="64" ry="9" fill="none" stroke="#9a6a24" strokeWidth="3" />
  </>,
  torch: <>
    <path d="M94 192 L101 112 L115 112 L107 192Z" fill="#8a5a33" />
    <path d="M108 114 C76 94 92 62 102 38 C107 60 118 56 117 32 C138 60 140 98 108 114Z" fill="#f08a24" />
    <path d="M108 106 C95 94 101 78 107 66 C112 80 123 86 108 106Z" fill="#f5c842" />
  </>,
};

export const Cutout: React.FC<{ kind: keyof typeof CUTOUTS; x: number; y: number; size: number; rotate: number; pop: number }> = ({ kind, x, y, size, rotate, pop }) => {
  if (pop <= 0) return null;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, overflow: 'visible',
      transform: `rotate(${rotate}deg) scale(${pop})`, filter: 'drop-shadow(0 14px 14px rgba(0,0,0,.28))' }}>
      <g filter="url(#cut)">{CUTOUTS[kind]}</g>
    </svg>
  );
};

/* Split-flap tiles. Each tile steps through `chars` from `start`, `step` frames a flip: the top
   half of the old character folds down over the new one, as on the site's counter. */
export const Flaps: React.FC<{ frame: number; tiles: { chars: string[]; start: number; step: number; flip?: number }[]; size: number; gap?: number }> = ({ frame, tiles, size, gap = 0.1 }) => (
  <div style={{ display: 'flex', gap: size * gap }}>
    {tiles.map((t, i) => <Flap key={i} frame={frame} {...t} size={size} />)}
  </div>
);

const Flap: React.FC<{ frame: number; chars: string[]; start: number; step: number; flip?: number; size: number }> = ({ frame, chars, start, step, flip = step, size }) => {
  const steps = chars.length - 1;
  const t = frame - start;
  const j = t < 0 ? -1 : Math.min(steps - 1, Math.floor(t / step));
  const p = j < 0 ? 1 : (t - j * step) / flip;
  const done = j < 0 || p >= 1;
  const prev = j < 0 ? chars[0] : chars[j];
  const next = j < 0 ? chars[0] : chars[j + 1];
  const w = size * 0.74 * (Math.max(...chars.map(c => c.length)) > 1 ? 1.4 : 1), h = size * 1.12, r = size * 0.09;
  const face = (ch: string, half: 'top' | 'bottom', extra: React.CSSProperties = {}) => (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', borderRadius: r, fontFamily: SANS, fontWeight: 900,
      fontSize: size, lineHeight: 1, color: C.paper, background: half === 'top' ? '#252420' : '#1d1c19',
      clipPath: half === 'top' ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)', ...extra }}>{ch}</div>
  );
  return (
    <div style={{ position: 'relative', width: w, height: h, perspective: done ? undefined : size * 3, borderRadius: r, boxShadow: `0 ${size * 0.05}px ${size * 0.1}px rgba(17,17,15,.35)` }}>
      {done ? (
        /* At rest: one plain face (top half lighter), no clipping, which Chrome sometimes drops. */
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', borderRadius: r, fontFamily: SANS, fontWeight: 900,
          fontSize: size, lineHeight: 1, color: C.paper, background: 'linear-gradient(#252420 50%, #1d1c19 50%)' }}>{next}</div>
      ) : (
        <>
          {face(next, 'top')}
          {face(prev, 'bottom')}
        </>
      )}
      {!done && p < 0.5 && face(prev, 'top', { backfaceVisibility: 'hidden', transform: `rotateX(${-p * 2 * 90}deg)`, transformOrigin: '50% 50%' })}
      {!done && p >= 0.5 && face(next, 'bottom', { backfaceVisibility: 'hidden', transform: `rotateX(${(1 - (p - 0.5) * 2) * 90}deg)`, transformOrigin: '50% 50%' })}
      <div style={{ position: 'absolute', zIndex: 2, left: 0, right: 0, top: `calc(50% - ${size * 0.012}px)`, height: size * 0.024, background: 'rgba(0,0,0,.75)' }} />
    </div>
  );
};

/* The newsletter card's pair of atumpan and their hooked sticks, playing the card's beat:
   each stick swings down, the skin gives, and three short beat marks flash. `t` is in frames. */
export const Drums: React.FC<{ t: number; height: number }> = ({ t, height }) => {
  const PERIOD = 27;
  const phase = (offset: number) => (((t - offset) % PERIOD) + PERIOD) % PERIOD / PERIOD;
  const key = (x: number, pts: [number, number][]) => {
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) return interpolate(x, [pts[i - 1][0], pts[i][0]], [pts[i - 1][1], pts[i][1]]);
    return pts[pts.length - 1][1];
  };
  const hit = (x: number) => key(x, [[0, 22], [0.35, 22], [0.5, 0], [0.64, 13], [1, 22]]);
  const skin = (x: number) => key(x, [[0, 1], [0.48, 1], [0.53, 0.55], [0.62, 1.15], [0.72, 0.95], [1, 1]]);
  const beat = (x: number) => key(x, [[0, 0], [0.48, 0], [0.55, 1], [0.82, 0], [1, 0]]);
  const a = t < 0 ? 0 : phase(0), b = t < 0 ? 0 : phase(PERIOD / 2);
  const wood = '#8a4a24', shade = '#5e2f15', cord = '#f3e6c8';
  const drum = (body: string, cordD: string, cloth: [number, number, number, number], shadeD: string, skinC: [number, number, number, number], s: number, id: string) => (
    <g>
      <clipPath id={id}><path d={body} /></clipPath>
      <path d={body} fill={wood} />
      <g clipPath={`url(#${id})`}>
        <path d={cordD} fill="none" stroke={cord} strokeWidth={1.3} strokeLinejoin="round" />
        <rect x={cloth[0]} y={cloth[1]} width={cloth[2]} height={cloth[3]} fill={C.red} />
        <rect x={cloth[0]} y={cloth[1] + cloth[3] * 0.36} width={cloth[2]} height={cloth[3] * 0.22} fill={C.green} />
        <path d={shadeD} fill={shade} />
      </g>
      <path d={body} fill="none" stroke={C.ink} strokeWidth={1.5} strokeLinejoin="round" />
      <ellipse cx={skinC[0]} cy={skinC[1]} rx={skinC[2]} ry={skinC[3]} fill={cord} stroke={C.ink} strokeWidth={1.5}
        transform={`translate(${skinC[0]} ${skinC[1]}) scale(1 ${s}) translate(${-skinC[0]} ${-skinC[1]})`} />
    </g>
  );
  return (
    <svg viewBox="6 -46 108 166" height={height} width={height * 108 / 166} style={{ overflow: 'visible' }}>
      <circle cx={86} cy={-14} r={16} fill={C.red} />
      <path d="M4 112h112" stroke={C.ink} strokeWidth={1.5} />
      {drum('M15 46C15 72 20 92 24 112h20c4-20 9-40 9-66z', 'M15 50l8 24 8-24 8 24 8-24 8 24', [10, 78, 48, 11], 'M44 46c0 26-4 46-6 66h6c4-20 9-40 9-66z', [34, 46, 19, 5.5], skin(a), 'dr-a')}
      {drum('M65 56c0 23 4 40 8 56h18c4-16 8-33 8-56z', 'M65 60l7 21 7-21 7 21 7-21 7 21', [60, 86, 44, 10], 'M91 56c0 23-3 40-5 56h5c4-16 8-33 8-56z', [82, 56, 17, 5], skin(b), 'dr-b')}
      <g fill="none" stroke={C.ink} strokeWidth={1.6} strokeLinecap="round">
        <path d="M10 36l-5-4M14 30l-2-6M21 27l1-6" opacity={beat(a)} />
        <path d="M104 50l6-3M102 44l4-5" opacity={beat(b)} />
        <path d="M66 14L47 30q-7 5-6 14" strokeWidth={3.2} transform={`rotate(${hit(a)} 66 14)`} />
        <path d="M114 28L95 41q-8 5-8 14" strokeWidth={3.2} transform={`rotate(${hit(b)} 114 28)`} />
      </g>
    </svg>
  );
};
