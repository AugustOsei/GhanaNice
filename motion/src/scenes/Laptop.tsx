import React from 'react';
import { AbsoluteFill, Easing, Freeze, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SANS, SERIF } from '../brand';
import { PencilFilter } from '../components/Pencil';
import { Mosque } from './Mosque';
import { Seg, YarnStrand } from '../components/Yarn';

/* Beats 4–5. The camera pulls back from the drawing: it is on a laptop, and the page is the
   real Savannah region page, which opens on that same mosque. Then a close look at three
   things the site does, the same hand circling each one in red. */

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const LAPTOP = { x: 40, y: 330, w: 1000, h: 625 };
const PULL = [0, 40];
const FEATURE_AT = 44;
const FEATURE_FOR = 78;

type Box = [number, number, number, number];
const FEATURES: {
  n: string; title: string; shot: string; loop: Box; label: string; labelAt: 'below' | 'right'; caption: string;
}[] = [
  { n: '01', title: 'Explore regions', shot: 'laptop-regions', loop: [0.07, 0.3, 0.93, 0.93], label: 'All 16 regions', labelAt: 'below',
    caption: 'Explore Ghana’s sixteen regions, from the coast to the savanna.' },
  { n: '02', title: 'Share a nice place', shot: 'laptop-tip', loop: [0.07, 0.56, 0.46, 0.9], label: 'Leave GhanaNice a tip', labelAt: 'below',
    caption: 'You give us the lead. We’ll do the digging.' },
  { n: '03', title: 'Travel directory', shot: 'laptop-directory', loop: [0.855, 0.0, 0.99, 0.09], label: 'List your service', labelAt: 'right',
    caption: 'A checked starting list of tour guides, transport and places to stay across Ghana.' },
];
export const LAPTOP_LENGTH = FEATURE_AT + FEATURES.length * FEATURE_FOR;

/* A hand-drawn loop round a box (fractions of the screen), overshooting where it closes. */
export function loopAround([x0, y0, x1, y1]: Box): string {
  const L = LAPTOP;
  const X = (f: number) => L.x + L.w * f, Y = (f: number) => L.y + L.h * f;
  const cx = (x0 + x1) / 2, padX = (x1 - x0) * 0.1 + 0.01, padY = (y1 - y0) * 0.12 + 0.015;
  return `M ${X(cx)} ${Y(y0 - padY)} C ${X(x1 + padX)} ${Y(y0 - padY * 1.4)}, ${X(x1 + padX * 1.2)} ${Y(y1 + padY)}, ${X(cx + 0.02)} ${Y(y1 + padY)}
    C ${X(x0 - padX)} ${Y(y1 + padY * 1.2)}, ${X(x0 - padX * 1.1)} ${Y(y0 - padY * 0.6)}, ${X(cx - 0.04)} ${Y(y0 - padY)}
    C ${X(cx + 0.08)} ${Y(y0 - padY * 1.3)}, ${X(cx + 0.18)} ${Y(y0 - padY * 0.6)}, ${X(cx + 0.22)} ${Y(y0 - padY * 0.1)}`;
}

/* The last feature's loop, in screen space: the finale's strand starts from it. */
export const LAST_LOOP = loopAround(FEATURES[FEATURES.length - 1].loop);

export const Laptop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pull = interpolate(frame, PULL, [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.1, 1) });
  /* The screen grows out of the full frame into the laptop. */
  const rect = {
    x: LAPTOP.x * pull, y: LAPTOP.y * pull,
    w: 1080 + (LAPTOP.w - 1080) * pull, h: 1350 + (LAPTOP.h - 1350) * pull,
  };
  /* The drawing, cover-fitted round the mosque, gives way to the real page (same mosque). */
  const artScale = Math.max(rect.w / 1080, rect.h / 1350);
  const toPage = interpolate(frame, [18, 34], [0, 1], clamp);
  const bezel = interpolate(frame, [10, 30], [0, 1], clamp);
  const deck = interpolate(frame, [22, 44], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });

  const index = Math.min(FEATURES.length - 1, Math.max(0, Math.floor((frame - FEATURE_AT) / FEATURE_FOR)));
  const local = frame - FEATURE_AT - index * FEATURE_FOR;
  const inFeatures = frame >= FEATURE_AT;
  const f = FEATURES[index];
  const scroll = (i: number) => interpolate(frame - FEATURE_AT - i * FEATURE_FOR, [0, 14], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.25, 1) });
  const loop = interpolate(local, [12, 34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const label = spring({ frame: local - 30, fps, config: { damping: 14, stiffness: 140 } });
  const head = spring({ frame: local - 2, fps, config: { damping: 16, stiffness: 120 } });
  const caption = spring({ frame: local - 8, fps, config: { damping: 16, stiffness: 120 } });

  const L = LAPTOP;
  const arrow: Seg[] = f.labelAt === 'below'
    /* From the label below the laptop up to the loop's lower right. */
    ? [{ kind: 'main', d: `M ${L.x + L.w * 0.86} ${L.y + L.h + 118} C ${L.x + L.w * 0.92} ${L.y + L.h + 70}, ${L.x + L.w * Math.min(0.93, f.loop[2] + 0.06)} ${L.y + L.h + 10}, ${L.x + L.w * Math.min(0.87, f.loop[2])} ${L.y + L.h * Math.min(0.97, f.loop[3] + 0.06)}` }]
    /* From the label below the laptop, up past its right edge, curling into the nav button. */
    : [{ kind: 'main', d: `M ${L.x + L.w * 0.97} ${L.y + L.h + 118} C ${L.x + L.w + 40} ${L.y + L.h + 60}, ${L.x + L.w + 34} ${L.y + 140}, ${L.x + L.w + 26} ${L.y + 80}
        C ${L.x + L.w + 20} ${L.y + 40}, ${L.x + L.w + 4} ${L.y + L.h * 0.13}, ${L.x + L.w * 0.97} ${L.y + L.h * 0.105}` }];

  return (
    <AbsoluteFill style={{ background: C.paper, fontFamily: SANS, color: C.ink }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}><defs><PencilFilter id="l-pencil" scale={2} frequency={0.03} /></defs></svg>

      <div style={{ position: 'absolute', left: rect.x - 22 * bezel, top: rect.y - 22 * bezel, width: rect.w + 44 * bezel, height: rect.h + 44 * bezel, borderRadius: 26 * bezel, background: '#0b0b0a', opacity: bezel }} />
      <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, overflow: 'hidden', background: C.paper }}>
        {toPage < 1 && (
          <div style={{ position: 'absolute', width: 1080, height: 1350, transformOrigin: '0 0',
            transform: `translate(${rect.w / 2 - 540 * artScale}px, ${rect.h / 2 - 770 * artScale}px) scale(${artScale})` }}>
            <Freeze frame={300}><Mosque /></Freeze>
          </div>
        )}
        {/* The real pages, each scrolling up into view as its feature begins. */}
        <Img src={staticFile('site/laptop-savannah.png')} style={{ position: 'absolute', width: '100%', height: '100%', opacity: toPage }} />
        {FEATURES.map((feat, i) => (
          <Img key={feat.shot} src={staticFile(`site/${feat.shot}.png`)} style={{ position: 'absolute', width: '100%', height: '100%',
            transform: `translateY(${(1 - scroll(i)) * 100}%)`, boxShadow: scroll(i) > 0 ? '0 -30px 60px rgba(0,0,0,.3)' : 'none' }} />
        ))}
      </div>

      <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path d={`M ${L.x - 70} ${L.y + L.h + 40} H ${L.x + L.w + 70} L ${L.x + L.w + 30} ${L.y + L.h + 74} H ${L.x - 30} Z`} pathLength={1}
          fill="none" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - deck} filter="url(#l-pencil)" />
        {inFeatures && (
          <>
            <YarnStrand id={`loop${index}`} segs={[{ kind: 'main', d: loopAround(f.loop) }]} progress={loop} width={11} frame={frame}
              color={C.red} twist="#a8321f" ball={loop < 1} ballSize={0.8} filter="url(#l-pencil)" />
            <YarnStrand id={`arrow${index}`} segs={arrow} progress={label} width={7} frame={frame} color={C.red} twist="#a8321f" ball={false} filter="url(#l-pencil)" />
          </>
        )}
      </svg>

      {inFeatures && (
        <>
          <div style={{ position: 'absolute', left: 64, top: 110, display: 'flex', alignItems: 'baseline', gap: 26, opacity: head, transform: `translateY(${(1 - head) * 40}px)` }}>
            <span style={{ fontSize: 120, fontWeight: 900, letterSpacing: '-0.08em', color: C.red }}>{f.n}</span>
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 64 }}>{f.title}</span>
          </div>
          <div style={{ position: 'absolute', right: 70, top: L.y + L.h + 132, fontSize: 30, fontWeight: 800,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: C.red, opacity: label, transform: `translateY(${(1 - label) * 16}px)` }}>{f.label}</div>
          <div style={{ position: 'absolute', left: 64, right: 380, top: L.y + L.h + 200, fontFamily: SERIF, fontSize: 44, lineHeight: 1.2,
            opacity: caption, transform: `translateY(${(1 - caption) * 24}px)` }}>{f.caption}</div>
        </>
      )}
    </AbsoluteFill>
  );
};
