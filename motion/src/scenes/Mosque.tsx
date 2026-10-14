import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SANS, SERIF } from '../brand';
import { Landmark, photoUnder } from '../components/Landmark';
import { PencilFilter } from '../components/Pencil';

/* Beat 3, photo to drawing. The Larabanga photo arrives through the opening's window. A yellow
   pencil line traces the mosque straight over it (the drawing was traced from this photo, so
   they line up), the photo melts away to paper, sun and savanna ground, and the line turns to
   ink. The caption and the site's "found it nice" heart settle beneath. */

/* The mosque drawing and where its source photo sits under it. */
const MOSQUE = { left: 40, top: 540, width: 1000 };
const under = photoUnder('larabanga', MOSQUE.width);
/* Where the photo settles on screen: the opening flies it here. */
export const MOSQUE_PHOTO = { left: MOSQUE.left + under.left, top: MOSQUE.top + under.top, width: under.width, height: under.height };
export const MOSQUE_PHOTO_SRC = 'photos/larabanga-mosque.jpg';
export const MOSQUE_LENGTH = 96;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* `backdrop` renders only the paper, sun and ground: the opening shows it round the growing
   window. */
export const Mosque: React.FC<{ backdrop?: boolean }> = ({ backdrop = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = interpolate(frame, [2, 40], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const photo = interpolate(frame, [34, 58], [1, 0], clamp);
  const fill = interpolate(frame, [40, 56], [0, 1], clamp);
  const caption = spring({ frame: frame - 58, fps, config: { damping: 14, stiffness: 130 } });
  const heart = spring({ frame: frame - 84, fps, config: { damping: 8, stiffness: 200 } });
  return (
    <AbsoluteFill style={{ background: C.paper, fontFamily: SANS, color: C.ink }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs><PencilFilter id="mosque-pencil" scale={3.2} frequency={0.035} /></defs>
      </svg>
      <div style={{ position: 'absolute', left: 540 - 230, top: 470, width: 460, height: 460, borderRadius: '50%', background: C.yellow }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 860, height: 140, background: C.red }} />
      {!backdrop && (
        <>
          {photo > 0 && <Img src={staticFile(MOSQUE_PHOTO_SRC)} style={{ position: 'absolute', ...MOSQUE_PHOTO, opacity: photo }} />}
          <div style={{ position: 'absolute', left: MOSQUE.left, top: MOSQUE.top }}>
            {/* Yellow while it traces over the photo, so it reads; ink once the photo has gone. */}
            <Landmark name="larabanga" width={MOSQUE.width} draw={draw} fill={fill} filter="url(#mosque-pencil)"
              stroke={interpolateColors(photo, [0, 1], [C.ink, C.yellow])} strokeWidth={2.8 + photo * 2.2} />
          </div>
          <div style={{ position: 'absolute', left: 64, top: 1060, opacity: caption, transform: `translateY(${(1 - caption) * 30}px)` }}>
            <div style={{ fontFamily: SERIF, fontSize: 54, letterSpacing: '-0.02em' }}>Larabanga Mosque</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 10, opacity: 0.7 }}>Savannah Region</div>
          </div>
          <div style={{ position: 'absolute', right: 64, top: 1080, transform: `scale(${0.7 + heart * 0.3})`, opacity: Math.min(1, heart * 2),
            padding: '16px 24px', borderRadius: 99, border: `2px solid ${heart > 0.5 ? C.yellow : C.ink}`, background: heart > 0.5 ? C.yellow : 'transparent',
            fontSize: 22, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {heart > 0.5 ? '♥' : '♡'} Found it nice
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
