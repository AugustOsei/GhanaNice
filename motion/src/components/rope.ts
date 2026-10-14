/* The travel directory hero's rope (dist/travel-directory.js): one line sampled into points
   that can wind up into a ball of yarn and unwind into another shape. Runs in the browser,
   where SVG paths can be measured. */
export type Pt = [number, number];
export const ROPE_POINTS = 440;

/* Points evenly spaced along an SVG path, mapped through an affine fit (scale, dx, dy) and then
   placed on screen at (x, y) with scale s. */
export function samplePath(d: string, count: number, place: (p: Pt) => Pt): Pt[] {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  const length = path.getTotalLength();
  return Array.from({ length: count }, (_, i) => {
    const p = path.getPointAtLength((length * i) / (count - 1));
    return place([p.x, p.y]);
  });
}

/* A ball of yarn: wound round a circle, each turn tilted from the last, with a loose end.
   Deterministic (seeded) so every render of a frame is identical. */
export function tangle(count: number, cx: number, cy: number, radius: number, seed = 0.37): Pt[] {
  const turn = Math.PI * 2;
  const windings = 11;
  const spin = seed * turn;
  const lean = (seed * 7.3 % 1) * turn;
  const tail = 0.06;
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    if (t > 1 - tail) {
      const out = (t - (1 - tail)) / tail;
      return [cx + radius * 0.72 + radius * 0.76 * out, cy + radius * 0.66 + radius * 0.18 * Math.sin(out * Math.PI * 1.4) + radius * 0.12 * out];
    }
    const wind = t / (1 - tail);
    const around = turn * windings * wind;
    const angle = spin + Math.PI * 1.25 * wind;
    const tilt = 0.22 + 0.78 * Math.abs(Math.sin(lean + Math.PI * 1.6 * wind));
    const across = radius * Math.cos(around);
    const along = radius * Math.sin(around) * tilt;
    return [cx + across * Math.cos(angle) - along * Math.sin(angle), cy + across * Math.sin(angle) + along * Math.cos(angle)];
  });
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const unit = (v: number) => Math.min(1, Math.max(0, v));

/* From one shape through a knot to another, one end leading the other like a rope (the site's
   own timing: let go quickly, stay tangled for a beat, then gather). */
export function ropeAt(from: Pt[], knot: Pt[], to: Pt[], t: number): Pt[] {
  return to.map((end, i) => {
    const lag = (i / to.length) * 0.3;
    const loosen = ease(unit((t * 1.3 - lag) / 0.36));
    const gather = ease(unit((t * 1.3 - lag - 0.52) / 0.48));
    const x = from[i][0] + (knot[i][0] - from[i][0]) * loosen;
    const y = from[i][1] + (knot[i][1] - from[i][1]) * loosen;
    return [x + (end[0] - x) * gather, y + (end[1] - y) * gather];
  });
}

export const toD = (points: Pt[]) => `M${points.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}`;
