import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SANS, SERIF } from '../brand';
import { PencilFilter } from '../components/Pencil';
import { STAR_D } from '../components/Star';
import { YarnStrand } from '../components/Yarn';

/* Beat 6. The night page rises over the laptop with the two invitations, in the site's words,
   the yarn draws the star over ghananice.com, and the partners' rail (as on the site) slides
   in beneath. */
export const FINALE_LENGTH = 150;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const STAR = [{ kind: 'main' as const, d: STAR_D }];
/* The site's partner rail, same logos and order (dist/index.html). */
const PARTNERS = [
  { src: 'partners/venture-nest.png', h: 34 },
  { src: 'partners/servabot.png', h: 84 },
  { src: 'partners/partner-symbol.webp', h: 56 },
  { src: 'partners/colourfro.png', h: 84 },
];

export const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: Easing.bezier(0.6, 0, 0.2, 1) });
  const a = spring({ frame: frame - 14, fps, config: { damping: 15, stiffness: 120 } });
  const b = spring({ frame: frame - 40, fps, config: { damping: 15, stiffness: 120 } });
  const star = interpolate(frame, [62, 90], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const fill = spring({ frame: frame - 88, fps, config: { damping: 10, stiffness: 120 } });
  const partners = spring({ frame: frame - 104, fps, config: { damping: 15, stiffness: 120 } });
  const url = spring({ frame: frame - 94, fps, config: { damping: 13, stiffness: 120 } });
  const S = 4.8;
  const line = (top: number, ask: string, act: string, p: number) => (
    <div style={{ position: 'absolute', left: 64, right: 64, top, opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 54, color: C.paper, opacity: 0.85 }}>{ask}</div>
      <div style={{ fontSize: 104, fontWeight: 900, letterSpacing: '-0.08em', color: C.yellow, lineHeight: 1, marginTop: 6 }}>{act}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - rise) * 100}% 0 0 0)`, background: C.ink, fontFamily: SANS }}>
      {line(130, 'Know somewhere good?', 'Put us on ↘', a)}
      {line(380, 'Run a travel service in Ghana?', 'List your service ↗', b)}
      <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0 }}>
        <defs><PencilFilter id="f-pencil" scale={1.4} frequency={0.04} /></defs>
        <g transform={`translate(540 700) scale(${S}) translate(-32 -30)`}>
          <path d={STAR_D} fill={C.yellow} opacity={fill} />
          {star > 0 && <YarnStrand id="f-star" segs={STAR} progress={star} width={13 / S} frame={frame} ball={star < 1} filter="url(#f-pencil)" />}
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 850, textAlign: 'center', color: C.paper, opacity: url, transform: `translateY(${(1 - url) * 40}px)` }}>
        <div style={{ fontSize: 100, fontWeight: 900, letterSpacing: '-0.075em' }}>
          ghana<span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, color: C.red }}>nice</span>.com
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, marginTop: 14, opacity: 0.85 }}>Good places are better when they’re shared.</div>
      </div>
      <div style={{ position: 'absolute', left: 64, right: 64, top: 1110, opacity: partners, transform: `translateY(${(1 - partners) * 50}px)` }}>
        <div style={{ color: C.red, fontSize: 18, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Our partners</div>
        <div style={{ display: 'flex', border: `2px solid ${C.paper}`, background: C.paper, gap: 2 }}>
          {PARTNERS.map(p => (
            <div key={p.src} style={{ flex: 1, height: 112, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
              <Img src={staticFile(p.src)} style={{ height: p.h, maxWidth: '100%', objectFit: 'contain' }} />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
