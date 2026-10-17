import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SANS, SERIF } from '../brand';
import { clamp, Cutout, grain, Print } from './parts';

/* The way in, for someone who has never seen the site: the home page's "Ghana is nice.", four
   postcards of real places from four regions, what GhanaNice is (the site's own description),
   then the news: a new Festivals section. The yellow of the counter rises to take over. */

export const INTRO_LENGTH = 170;
const ease = Easing.bezier(0.6, 0, 0.2, 1);

const CARDS = [
  { src: 'photos/jamestown-lighthouse-1200.webp', place: 'Jamestown Lighthouse · Greater Accra', credit: 'Gereon K. · CC BY-SA 4.0', x: 40, y: 560, r: -6, at: 18 },
  { src: 'photos/wli-falls-1200.webp', place: 'Wli Falls · Volta', credit: 'Mike Norton · CC BY 2.0', x: 560, y: 520, r: 5, at: 24 },
  { src: 'photos/cape-coast-castle-1200.webp', place: 'Cape Coast Castle · Central', credit: 'Jasmine Sackey-Addo · CC BY-SA 4.0', x: 70, y: 880, r: 3, at: 30 },
  { src: 'photos/larabanga-mosque.jpg', place: 'Larabanga Mosque · Savannah', credit: 'ZSM · CC BY-SA 4.0', x: 580, y: 860, r: -4, at: 36 },
];

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (at: number, damping = 15) => spring({ frame: frame - at, fps, config: { damping, stiffness: 120 } });
  const ghana = s(2), nice = s(10, 11), line = s(46), locals = s(62);
  /* Everything of the welcome slides up and away for the news. */
  const away = interpolate(frame, [100, 116], [0, 1], { ...clamp, easing: ease });
  const tag = s(106, 11), title = s(112, 13), where = s(122);
  const wipe = interpolate(frame, [152, INTRO_LENGTH], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ background: grain(C.ink), fontFamily: SANS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-away * 1400}px)` }}>
        <div style={{ position: 'absolute', left: 64, top: 90, color: C.paper }}>
          <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: '-0.08em', lineHeight: 1, opacity: ghana, transform: `translateY(${(1 - ghana) * 40}px)` }}>
            Ghana is <span style={{ display: 'inline-block', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.02em', color: C.yellow,
              opacity: nice, transform: `scale(${0.6 + nice * 0.4}) rotate(${(1 - nice) * -8}deg)`, transformOrigin: '0 80%' }}>nice.</span>
          </div>
          <div style={{ marginTop: 34, width: 900, fontFamily: SERIF, fontSize: 44, lineHeight: 1.25, opacity: line, transform: `translateY(${(1 - line) * 30}px)` }}>
            GhanaNice is a people-powered guide to good places, food, craft and experiences across Ghana’s sixteen regions.
          </div>
          <div style={{ marginTop: 18, fontSize: 26, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.yellow, opacity: locals }}>
            For locals and visitors alike
          </div>
        </div>
        {CARDS.map(c => (
          <Print key={c.src} src={c.src} x={c.x} y={c.y} w={460} ratio={1.45} rotate={c.r} drop={s(c.at, 13)}
            place={c.place} credit={c.credit} captionSize={21} tape={{ left: 150, w: 150, r: c.r * -1.4 }} />
        ))}
      </div>

      <div style={{ position: 'absolute', left: 64, right: 64, top: 430 }}>
        <div style={{ display: 'inline-block', padding: '12px 22px 10px', background: C.red, color: C.paper, fontSize: 34, fontWeight: 900,
          letterSpacing: '0.12em', textTransform: 'uppercase', opacity: tag > 0 ? 1 : 0,
          transform: `rotate(-3deg) scale(${tag > 0 ? 1.6 - tag * 0.6 : 0})` }}>New on GhanaNice</div>
        <div style={{ marginTop: 30, fontSize: 210, fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 0.9, color: C.paper,
          opacity: title, transform: `translateY(${(1 - title) * 60}px)` }}>Festivals</div>
        <div style={{ marginTop: 28, fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, lineHeight: 1.2, color: C.paper, opacity: where * 0.9,
          transform: `translateY(${(1 - where) * 30}px)` }}>
          Ghana’s festivals, month by month
        </div>
      </div>

      <Cutout kind="drum" x={850} y={330} size={230} rotate={10 - (frame - 110) * 0.08} pop={s(114, 9)} />
      <Cutout kind="umbrella" x={860} y={960} size={260} rotate={-8 + (frame - 110) * 0.06} pop={s(120, 9)} />
      <Cutout kind="torch" x={220} y={1010} size={200} rotate={6 + (frame - 110) * 0.1} pop={s(126, 9)} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${wipe * 100}%`, background: grain(C.yellow) }} />
    </AbsoluteFill>
  );
};
