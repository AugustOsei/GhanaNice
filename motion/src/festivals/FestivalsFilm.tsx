import React from 'react';
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, SANS, SERIF } from '../brand';
import { BOARD, clamp, Cutout, CutDefs, Drums, Flaps, grain, Print } from './parts';
import { Intro, INTRO_LENGTH } from './Intro';
import { Backdrop, Bleed, BleedContext, useBleed } from './bleed';

/* "What's on in Ghana": a 26-second film (1080×1350, silent) for the festivals section and the
   monthly newsletter. A welcome to GhanaNice announces the new Festivals section; the split-flap counter turns to 46; the festivals board assembles and its
   to-do list gets ticked; the month tiles flip through four festivals from four regions; the
   newsletter card's drums play under the sign-up. Every photo is the site's own (SOURCES.md);
   every line is the site's wording. Festival months are given as "usually", as on the site. */

const MAIN_LENGTH = 600;
export const FESTIVALS_LENGTH = INTRO_LENGTH + MAIN_LENGTH;

const COUNT_END = 92;      // the counter band settles to the foot of the board
const BOARD_END = 236;     // the board clears for the months
const MONTHS_AT = 240;
const MONTH_FOR = 50;
const SIGNUP_AT = 446;

/* Four festivals, four regions, four months: from the site's festival pages (tools/festivals/*.json). */
const MONTHS = [
  { m: 'MAY', name: 'Aboakyer', place: 'Winneba', region: 'Central', src: 'festivals/aboakyer.webp', caption: 'The catch, carried in triumph', credit: 'Fquasie · CC BY-SA 4.0', ratio: 1.5 },
  { m: 'AUG', name: 'Chale Wote', place: 'James Town, Accra', region: 'Greater Accra', src: 'festivals/chale-wote.webp', caption: 'The festival’s name on the street', credit: 'Fquasie · CC BY-SA 4.0', ratio: 1.5 },
  { m: 'OCT', name: 'Ngmayem', place: 'Odumase-Krobo', region: 'Eastern', src: 'festivals/ngmayem.webp', caption: 'The chief of Odumase-Krobo on his palanquin', credit: 'Fquasie · CC BY-SA 4.0', ratio: 1.5 },
  { m: 'NOV', name: 'Hogbetsotso', place: 'Anloga', region: 'Volta', src: 'festivals/hogbetsotso.webp', caption: 'Carrying offerings at Hogbetsotso', credit: 'JY midey · CC BY-SA 4.0', ratio: 1.5 },
];
const TODO = ['watch the deer hunt at Winneba', 'eat kpokpoi at Homowo', 'see the umbrellas at Fetu Afahye', 'Fiok at Sandema in December'];

const ease = Easing.bezier(0.6, 0, 0.2, 1);

export const FestivalsFilm: React.FC = () => <Film bleed={{ above: 0, below: 0 }} />;
/* 9:16 for Reels and TikTok: the same stage, kept clear of the apps' buttons and caption. */
export const FestivalsVertical: React.FC = () => <Film bleed={{ above: 200, below: 370 }} />;

const Film: React.FC<{ bleed: Bleed }> = ({ bleed }) => (
  <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
    <CutDefs />
    <BleedContext.Provider value={bleed}>
      <div style={{ position: 'absolute', left: 0, top: bleed.above, width: 1080, height: 1350 }}>
        <Sequence durationInFrames={INTRO_LENGTH} layout="none"><Intro /></Sequence>
        <Sequence from={INTRO_LENGTH} layout="none"><Main /></Sequence>
      </div>
    </BleedContext.Provider>
  </AbsoluteFill>
);

const Main: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.ink }}>
      <Backdrop background={grain(BOARD)} />
      {frame < BOARD_END + 20 && <Board frame={frame} />}
      {frame >= MONTHS_AT - 6 && frame < SIGNUP_AT + 24 && <Months frame={frame - MONTHS_AT} />}
      {frame < MONTHS_AT && <Count frame={frame} />}
      {frame >= SIGNUP_AT && <SignUp frame={frame - SIGNUP_AT} />}
    </AbsoluteFill>
  );
};

/* Beat 1. The yellow band fills the frame and the tiles flip to 46; then it sinks to the foot of
   the board, where it sits on the site. */
const Count: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const { above, below } = useBleed();
  const sink = interpolate(frame, [70, COUNT_END], [0, 1], { ...clamp, easing: ease });
  const leave = interpolate(frame, [BOARD_END - 14, BOARD_END + 2], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const top = interpolate(sink, [0, 1], [-40 - above, 1110]) + leave * (300 + below);
  const line = spring({ frame: frame - 40, fps, config: { damping: 16, stiffness: 120 } });
  const units = Array.from({ length: 17 }, (_, i) => String(i % 10));
  return (
    <div style={{ position: 'absolute', left: -120, width: 1320, top, height: 1500 + above + below, zIndex: 5,
      borderRadius: `${sink * 50}% ${sink * 50}% 0 0 / ${sink * 12}% ${sink * 12}% 0 0`, background: grain(C.yellow) }}>
      <div style={{ position: 'absolute', left: 120, right: 120, top: interpolate(sink, [0, 1], [500 + above, 46]),
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        transform: `scale(${interpolate(sink, [0, 1], [1, 0.62])})`, transformOrigin: '50% 0' }}>
        <div style={{ position: 'absolute', top: -360, fontSize: 30, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 1 - sink }}>
          ghana<span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, letterSpacing: 0, textTransform: 'none', color: C.red }}>nice</span>.com/festivals
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <Flaps frame={frame} size={210} tiles={[
            { chars: ['0', '1', '2', '3', '4'], start: 8, step: 9 },
            { chars: units.slice(0, 17), start: 8, step: 2.6 },
          ]} />
          <div style={{ fontSize: 68, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.95 }}>festivals and<br />cultural events<br />listed</div>
        </div>
        <div style={{ marginTop: 48, fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, lineHeight: 1.2, textAlign: 'center',
          opacity: line * (1 - sink), transform: `translateY(${(1 - line) * 30}px)` }}>
          across all 16 of Ghana’s regions,<br />January to December.
        </div>
      </div>
    </div>
  );
};

/* Beat 2. The board assembles above the band: the paper panel and its headline, three taped
   prints, the cut-outs, and the "To do this year" note, whose list gets ticked off. Then
   everything slides off the board. */
const Board: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const s = (at: number, damping = 13) => spring({ frame: frame - at, fps, config: { damping, stiffness: 110 } });
  const out = interpolate(frame, [BOARD_END - 16, BOARD_END + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const drift = (speed: number) => (frame - 90) * speed;
  const fly = (dx: number, dy: number, r = 0): React.CSSProperties => ({
    position: 'absolute', inset: 0, transform: `translate(${out * dx}px, ${out * dy}px) rotate(${out * r}deg)` });
  const panel = s(84, 18);
  const head = s(92, 16);
  return (
    <AbsoluteFill>
      <div style={fly(0, -1400)}>
        <div style={{ position: 'absolute', left: 520, top: 440, width: 600, height: 130, background: grain(C.lilac), transform: `rotate(-2deg) translateX(${(1 - s(86, 18)) * 700}px)`,
          boxShadow: '0 16px 30px -18px rgba(0,0,0,.4)' }} />
        <div style={{ position: 'absolute', left: 50, top: 520, width: 1080, height: 400, background: grain(C.paper),
          transform: `translateX(${(1 - panel) * 1150}px)`, boxShadow: '-18px 24px 40px -20px rgba(0,0,0,.45)' }}>
          <div style={{ position: 'absolute', left: 44, top: 40, fontSize: 168, lineHeight: 0.9, letterSpacing: '-0.02em', fontWeight: 900, opacity: head, transform: `translateY(${(1 - head) * 40}px)` }}>FESTIVALS</div>
          <div style={{ position: 'absolute', left: 48, width: 560, top: 210, fontFamily: SERIF, fontSize: 36, lineHeight: 1.3, opacity: s(104, 18) }}>
            For each one: where it happens, when it usually falls, who keeps it and what to expect.
          </div>
        </div>
      </div>
      <div style={fly(1200, -300, 20)}>
        <Print src="festivals/board/fetu.webp" x={560} y={60} w={470} ratio={1.5} rotate={3} drop={s(98)}
          place="Fetu Afahye · Cape Coast" credit="Bright Kwame Ayisi · CC BY-SA 4.0" captionSize={22} tape={{ right: 40, w: 160, r: 8 }} />
      </div>
      <div style={fly(1200, 400, 30)}>
        <Print src="festivals/board/agbamevoza.webp" x={670} y={760} w={380} ratio={1.5} rotate={-4} drop={s(112)}
          place="Agbamevoza" credit="JY midey · CC BY-SA 4.0" captionSize={22} tape={{ left: 30, w: 130, r: -6 }} />
      </div>
      <div style={fly(-1300, 300, -25)}>
        <Sticky frame={frame} drop={s(120, 15)} />
      </div>
      <div style={fly(0, 1400)}>
        <Cutout kind="drum" x={520} y={120 - drift(0.25)} size={170} rotate={8 + drift(0.06)} pop={s(100, 10)} />
        <Cutout kind="umbrella" x={1010} y={500 - drift(0.18)} size={180} rotate={-6 - drift(0.05)} pop={s(110, 10)} />
        <Cutout kind="torch" x={110} y={1000 - drift(0.22)} size={170} rotate={6 + drift(0.08)} pop={s(128, 10)} />
        <Cutout kind="bowl" x={500} y={1010 + drift(0.1)} size={190} rotate={-5} pop={s(118, 10)} />
        <Cutout kind="cocoa" x={60} y={500 + drift(0.12)} size={140} rotate={10 + drift(0.1)} pop={s(132, 10)} />
      </div>
    </AbsoluteFill>
  );
};

const Sticky: React.FC<{ frame: number; drop: number }> = ({ frame, drop }) => {
  if (drop <= 0) return null;
  const lift = 1 - Math.min(1, drop);
  return (
    <div style={{ position: 'absolute', left: 50, top: 60, width: 460, padding: '38px 32px 40px', background: grain(C.yellow),
      transform: `translateY(${-lift * 100}px) rotate(${-2.5 - lift * 6}deg) scale(${1 + lift * 0.2})`,
      boxShadow: '0 2px 0 rgba(0,0,0,.06), 0 24px 34px -20px rgba(0,0,0,.5)' }}>
      <div style={{ fontSize: 54, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.95, marginBottom: 16 }}>To do this year</div>
      {TODO.map((item, i) => {
        const tick = interpolate(frame, [146 + i * 16, 156 + i * 16], [0, 1], clamp);
        return (
          <div key={item} style={{ display: 'flex', gap: 16, padding: '13px 0 11px', borderBottom: '2px dotted rgba(17,17,15,.4)',
            fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, lineHeight: 1.2 }}>
            <svg width={30} height={30} viewBox="0 0 30 30" style={{ flex: '0 0 auto', marginTop: 4, overflow: 'visible' }}>
              <circle cx={15} cy={15} r={12} fill="none" stroke={C.ink} strokeWidth={2} />
              <path d="M6 15 L13 23 L30 -2" fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
                pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tick} />
            </svg>
            <span>{item}</span>
          </div>
        );
      })}
    </div>
  );
};

/* Beat 3. The month tiles flip, and each month's festival is taped onto the pile with its name,
   town and region. */
const Months: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const enter = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: ease });
  const leave = interpolate(frame, [SIGNUP_AT - MONTHS_AT, SIGNUP_AT - MONTHS_AT + 20], [0, 1], { ...clamp, easing: ease });
  const index = Math.max(0, Math.min(MONTHS.length - 1, Math.floor(frame / MONTH_FOR)));
  const tiles = [0, 1, 2].map(i => ({ chars: ['', ...MONTHS.map(m => m.m[i])], start: 2 + i * 2, step: MONTH_FOR, flip: 9 }));
  const local = frame - index * MONTH_FOR;
  const label = spring({ frame: local - 12, fps, config: { damping: 15, stiffness: 130 } });
  const f = MONTHS[index];
  const ROT = [-3, 2.5, -2, 3];
  return (
    <AbsoluteFill style={{ opacity: 1 - leave * 0.4, transform: `translateX(${-leave * 300}px)` }}>
      <div style={{ position: 'absolute', left: 64, top: 80, display: 'flex', alignItems: 'center', gap: 34, opacity: enter, transform: `translateY(${(1 - enter) * -60}px)` }}>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: C.paper, lineHeight: 1.1 }}>usually<br />in</div>
        <Flaps frame={frame} size={150} gap={0.08} tiles={tiles} />
      </div>
      {MONTHS.map((m, i) => {
        const drop = spring({ frame: frame - i * MONTH_FOR - 6, fps, config: { damping: 13, stiffness: 120 } });
        return (
          <Print key={m.name} src={m.src} x={70 + (i % 2) * 24} y={330 + (i % 2) * 14} w={940} ratio={m.ratio} rotate={ROT[i]} drop={drop}
            place={m.caption} credit={m.credit} captionSize={28} tape={i % 2 ? { left: 60, w: 220, r: -7 } : { right: 70, w: 240, r: 7 }} />
        );
      })}
      <div style={{ position: 'absolute', left: 64, right: 64, top: 1040, opacity: label, transform: `translateY(${(1 - label) * 30}px)` }}>
        <div style={{ fontSize: 112, fontWeight: 900, letterSpacing: '-0.06em', color: C.paper, lineHeight: 1 }}>{f.name}</div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: C.paper }}>{f.place}</span>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink, background: C.yellow, padding: '8px 14px 6px' }}>{f.region}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* Beat 4. The newsletter card, full frame: the yellow panel with the sun and the drums playing,
   the sign-up in the site's words, and where to find it. */
const SignUp: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const { above, below } = useBleed();
  const rise = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: ease });
  const s = (at: number) => spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 120 } });
  const typed = 'you@example.com'.slice(0, Math.max(0, Math.floor((frame - 50) / 1.6)));
  const press = interpolate(frame, [84, 88, 94], [0, 1, 0], clamp);
  const title = s(16), lead = s(28), form = s(40), url = s(104);
  return (
    <AbsoluteFill style={{ transform: `translateY(${(1 - rise) * (1350 + above + below)}px)` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: -above, bottom: -below, background: grain(C.paper), boxShadow: '0 -30px 60px rgba(0,0,0,.35)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: -above, height: 520 + above, background: grain(C.yellow), borderBottom: `3px solid ${C.ink}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 64, top: 70, fontSize: 30, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: title }}>The GhanaNice newsletter</div>
        <div style={{ position: 'absolute', right: 90, bottom: -3 }}><Drums t={frame - 18} height={610} /></div>
      </div>
      <div style={{ position: 'absolute', left: 64, right: 64, top: 566 }}>
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 0.95, opacity: title, transform: `translateY(${(1 - title) * 40}px)` }}>
          What’s on in Ghana, <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.02em', color: C.red }}>once a month</span>
        </div>
        <div style={{ marginTop: 26, fontFamily: SERIF, fontSize: 40, lineHeight: 1.25, opacity: lead, transform: `translateY(${(1 - lead) * 30}px)` }}>
          Next month’s festivals, new places on GhanaNice and a tip from a reader. One email a month.
        </div>
        <div style={{ marginTop: 40, display: 'flex', height: 100, border: `3px solid ${C.ink}`, background: C.white, opacity: form, transform: `translateY(${(1 - form) * 30}px)` }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 28px', fontSize: 38, color: typed ? C.ink : 'rgba(17,17,15,.4)' }}>
            {typed || 'you@example.com'}{typed && frame < 84 && frame % 16 < 8 ? '|' : ''}
          </div>
          <div style={{ display: 'grid', placeItems: 'center', padding: '0 34px', background: press ? C.red : C.ink, color: C.paper, fontSize: 34, fontWeight: 800,
            transform: `scale(${1 - press * 0.05})` }}>Sign me up</div>
        </div>
        <div style={{ marginTop: 16, fontSize: 26, color: 'rgba(17,17,15,.6)', opacity: form }}>Free. We’ll email you to confirm first. Unsubscribe any time.</div>
      </div>
      <div style={{ position: 'absolute', left: 64, right: 64, bottom: 64, opacity: url, transform: `translateY(${(1 - url) * 30}px)` }}>
        <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: '-0.065em' }}>
          ghana<span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, color: C.red }}>nice</span>.com/newsletter
        </div>
        <div style={{ marginTop: 6, fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: 'rgba(17,17,15,.75)' }}>or the sign-up at the foot of every page</div>
      </div>
    </AbsoluteFill>
  );
};
