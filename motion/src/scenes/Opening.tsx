import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SANS } from '../brand';
import { GHANA } from '../data/generated';
import { PencilFilter } from '../components/Pencil';
import { MOSQUE_PHOTO, MOSQUE_PHOTO_SRC, Mosque } from './Mosque';
import { NICE, NICE_VIEW } from '../components/niceStroke';
import { Seg, YarnStrand } from '../components/Yarn';

/* Beats 1–3 as one continuous move. The yarn writes "nice." under "Ghana is"; the words rise,
   and the strand leaves the full stop to draw a phone, whose screen lights with the live home
   page and its spinning Ghana window. The camera dives into that window as the reel slows and
   lands on Larabanga; the outline grows past the screen and the photo settles where the next
   beat's drawing lines up with it. */

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
/* The site's own reel photos (credited in dist/assets/CREDITS.md); the reel lands on the last. */
const PANELS = [
  { src: 'photos/jamestown-lighthouse-1200.webp', name: 'Jamestown', focus: '50% 40%' },
  { src: 'photos/wli-falls-1200.webp', name: 'Wli Falls', focus: '48% 45%' },
  { src: 'photos/cape-coast-castle-1200.webp', name: 'Cape Coast', focus: '55% 45%' },
  { src: 'photos/accra-seamstress-1200.webp', name: 'Made in Accra', focus: '50% 50%' },
  { src: 'photos/kakum-walkway-1200.webp', name: 'Kakum', focus: '50% 50%' },
] as const;
const VB = GHANA.viewBox.split(' ').map(Number);

/* Layout of the title block: "Ghana is" over the written "nice." (see FrameWrite). */
const NICE_SCALE = 600 / NICE_VIEW.w;
const NICE_AT = { x: 287, y: 560 };
const PERIOD = { x: NICE_AT.x + 317 * NICE_SCALE, y: NICE_AT.y + 146 * NICE_SCALE };
/* The block rises and shrinks about this point to make room for the phone. */
const RISE = { cx: 540, cy: 660, k: 0.82, dy: -455 };
const rise = (m: number) => ({ k: 1 - (1 - RISE.k) * m, dy: RISE.dy * m });
const lift = (p: { x: number; y: number }, m: number) => {
  const { k, dy } = rise(m);
  return { x: RISE.cx + (p.x - RISE.cx) * k, y: RISE.cy + (p.y - RISE.cy) * k + dy };
};

export const PHONE = { x: 330, y: 420, w: 420, h: 880, r: 60 };
const INSET = 18;
const SCREEN = { x: PHONE.x + INSET, y: PHONE.y + INSET, w: PHONE.w - INSET * 2, h: PHONE.h - INSET * 2 };
/* The home page's Ghana window, measured on the capture (public/site/home-hero.png). */
const WIN = { x: SCREEN.x + 0.2974 * SCREEN.w, y: SCREEN.y + 0.3649 * SCREEN.h, w: 0.4038 * SCREEN.w, h: 0.2707 * SCREEN.h };
const WIN_C = { x: WIN.x + WIN.w / 2, y: WIN.y + WIN.h / 2 };

/* Timeline (frames). */
const WRITE = [6, 70];
const RISE_AT = 92;
const DRAW_PHONE = [106, 146];
const LIGHT = [128, 150];
const PUSH = [158, 204];
const SETTLE = [204, 232];
export const OPENING_LENGTH = SETTLE[1];
const ZMAX = 1450 / WIN.h;

/* The reel inside the window: fast flicks, slowing, landing on Larabanga as the push ends. */
const REEL_ORDER = [0, 4, 2, 1, 3, 0, 4, 2, 1, 3, 0, 2, 5];
const REEL_HOLDS = [3, 3, 3, 3, 3, 4, 4, 5, 6, 7, 9, 12, 0];
const REEL_STARTS = REEL_HOLDS.reduce<number[]>((acc, h, i) => [...acc, i ? acc[i - 1] + REEL_HOLDS[i - 1] : LIGHT[0]], []);
const LANDED = REEL_STARTS[REEL_STARTS.length - 1];
const MOSQUE_X = 850 / 1600;
/* The mosque photo filling the window, centred on the mosque (same rule at every scale). */
const cover = (w: { x: number; y: number; w: number; h: number }) => {
  const width = (w.h * 1600) / 900;
  return { left: w.x + w.w / 2 - width * MOSQUE_X, top: w.y, width, height: w.h };
};

const ReelPhoto: React.FC<{ index: number; y: number }> = ({ index, y }) => {
  if (index === 5) {
    const c = cover({ x: 0, y: 0, w: WIN.w, h: WIN.h });
    return <Img src={staticFile(MOSQUE_PHOTO_SRC)} style={{ position: 'absolute', left: c.left, top: c.top + (y / 100) * WIN.h, width: c.width, height: c.height }} />;
  }
  const p = PANELS[index];
  return <Img src={staticFile(p.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.focus, transform: `translateY(${y}%)` }} />;
};

export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const write = interpolate(frame, WRITE, [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0.1, 0.4, 1) });
  const m = spring({ frame: frame - RISE_AT, fps, config: { damping: 18, stiffness: 90 } });
  const { k, dy } = rise(m);
  const period = lift(PERIOD, m);
  const phoneDraw = interpolate(frame, DRAW_PHONE, [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const lit = interpolate(frame, LIGHT, [0, 1], clamp);
  const push = interpolate(frame, PUSH, [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const Z = 1 + (ZMAX - 1) * push;
  const settling = frame >= SETTLE[0];

  /* Reel state. */
  const step = Math.max(0, REEL_STARTS.findLastIndex((s: number) => s <= frame));
  const local = frame - REEL_STARTS[step];
  const landed = step === REEL_ORDER.length - 1;
  const t = landed
    ? spring({ frame: local, fps, config: { damping: 12, stiffness: 170, mass: 0.7, overshootClamping: true } })
    : interpolate(local, [0, Math.max(2, Math.min(REEL_HOLDS[step], 6))], [0, 1], clamp);
  const incoming = REEL_ORDER[step];
  const outgoing = step ? REEL_ORDER[step - 1] : null;

  const { x, y, w, h, r } = PHONE;
  const phoneOutline: Seg[] = [
    { kind: 'slack', d: `M ${period.x} ${period.y} C ${period.x + 70} ${period.y + 50}, ${x + w + 50} ${y - 110}, ${x + w - r} ${y}` },
    { kind: 'main', d: `M ${x + w - r} ${y} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} H ${x + w - r}` },
  ];

  /* The settle: the window (as it stands at full push) grows past the screen while the photo
     flies to where the drawing will line up with it. */
  const e = interpolate(frame, SETTLE, [0, 1], { ...clamp, easing: Easing.bezier(0.6, 0, 0.2, 1) });
  const winZ = { x: WIN_C.x - (WIN.w * ZMAX) / 2, y: WIN_C.y - (WIN.h * ZMAX) / 2, w: WIN.w * ZMAX, h: WIN.h * ZMAX };
  const from = cover(winZ);
  const photo = {
    left: from.left + (MOSQUE_PHOTO.left - from.left) * e,
    top: from.top + (MOSQUE_PHOTO.top - from.top) * e,
    width: from.width + (MOSQUE_PHOTO.width - from.width) * e,
    height: from.height + (MOSQUE_PHOTO.height - from.height) * e,
  };
  const grow = 1 + e * e * 5;
  const focus = { x: photo.left + photo.width * MOSQUE_X, y: photo.top + photo.height * 0.55 };
  const focusIn = { x: winZ.w / 2, y: winZ.h * 0.55 };
  const clip = `translate(${focus.x - focusIn.x * grow} ${focus.y - focusIn.y * grow}) scale(${grow}) scale(${winZ.w / VB[2]} ${winZ.h / VB[3]}) ${GHANA.transform}`;

  return (
    /* Once the dive is complete the screen around the window is the home page's paper, so the
       settle keeps that colour behind the growing outline. */
    <AbsoluteFill style={{ background: settling ? C.paper : C.ink, fontFamily: SANS }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs>
          <PencilFilter id="o-pencil" scale={1.6} frequency={0.03} />
          <clipPath id="o-window" clipPathUnits="objectBoundingBox">
            <path d={GHANA.d} transform={`scale(${1 / VB[2]} ${1 / VB[3]}) ${GHANA.transform}`} />
          </clipPath>
          <clipPath id="o-settle" clipPathUnits="userSpaceOnUse"><path d={GHANA.d} transform={clip} /></clipPath>
        </defs>
      </svg>

      {!settling && (
        <AbsoluteFill style={{ transform: `scale(${Z})`, transformOrigin: `${WIN_C.x}px ${WIN_C.y}px` }}>
          {/* The phone's screen: the live home page, with our reel in its Ghana window. */}
          <div style={{ position: 'absolute', left: SCREEN.x, top: SCREEN.y, width: SCREEN.w, height: SCREEN.h, borderRadius: r - INSET, overflow: 'hidden', opacity: lit, background: C.paper }}>
            <Img src={staticFile('site/home-hero.png')} style={{ width: '100%', height: '100%' }} />
          </div>
          {lit > 0 && (
            <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, clipPath: 'url(#o-window)', overflow: 'hidden', opacity: lit, background: C.ink }}>
              {outgoing !== null && !landed && <ReelPhoto index={outgoing} y={t * 100} />}
              {outgoing !== null && landed && t < 1 && <ReelPhoto index={outgoing} y={t * 100} />}
              <ReelPhoto index={incoming} y={(t - 1) * 100} />
            </div>
          )}

          <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1350, transformOrigin: `${RISE.cx}px ${RISE.cy}px`, transform: `translateY(${dy}px) scale(${k})` }}>
            <div style={{ position: 'absolute', left: 305, top: 520, color: C.paper, fontSize: 92, fontWeight: 900, letterSpacing: '-0.1em', lineHeight: 0.8,
              opacity: interpolate(frame, [0, 4], [0.9, 1], clamp) }}>Ghana is</div>
            <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <g transform={`translate(${NICE_AT.x} ${NICE_AT.y}) scale(${NICE_SCALE})`}>
                <YarnStrand id="o-nice" segs={NICE} progress={write} width={7} frame={frame} ball={write < 1} filter="url(#o-pencil)" />
              </g>
            </svg>
          </div>
          <svg width={1080} height={1350} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {phoneDraw > 0 && <YarnStrand id="o-phone" segs={phoneOutline} progress={phoneDraw} width={15} frame={frame} filter="url(#o-pencil)" />}
          </svg>
        </AbsoluteFill>
      )}

      {settling && (
        <AbsoluteFill style={{ clipPath: e >= 0.999 ? undefined : 'url(#o-settle)' }}>
          <Mosque backdrop />
          <Img src={staticFile(MOSQUE_PHOTO_SRC)} style={{ position: 'absolute', ...photo }} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
