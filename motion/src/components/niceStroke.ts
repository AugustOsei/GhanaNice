/* "nice." as one strand of yarn, in a 400x200 frame. Thick runs are the letters; thin, faint
   runs are slack thread where a pen would lift (up to the dot, across to the full stop), so the
   word is still a single continuous line. Drawn by hand for this piece. */
export const NICE_VIEW = { w: 400, h: 200 };
export const NICE: { kind: 'main' | 'slack'; d: string }[] = [
 {
  "kind": "main",
  "d": "M 18 152 C 34 148, 48 112, 56 84 C 56 110, 54 132, 52 150 C 60 112, 72 84, 88 84 C 102 84, 100 120, 98 140 C 96 152, 116 156, 128 140 C 134 124, 136 104, 138 86"
 },
 {
  "kind": "slack",
  "d": "M 138 86 C 139 76, 140 66, 141 60"
 },
 {
  "kind": "main",
  "d": "M 141 60 C 137 54, 147 50, 148 56 C 149 62, 141 63, 141 58"
 },
 {
  "kind": "slack",
  "d": "M 141 58 C 140 70, 139 80, 138 92"
 },
 {
  "kind": "main",
  "d": "M 138 92 C 136 112, 133 134, 136 146 C 140 156, 158 152, 170 132 C 178 112, 190 90, 208 86 C 216 85, 217 93, 211 94 C 194 88, 176 104, 176 124 C 176 148, 202 158, 228 140 C 246 128, 262 112, 258 96 C 254 82, 232 88, 230 108 C 228 132, 246 154, 272 150 C 288 147, 298 140, 304 134"
 },
 {
  "kind": "slack",
  "d": "M 304 134 C 310 138, 314 142, 316 146"
 },
 {
  "kind": "main",
  "d": "M 316 146 C 312 140, 322 138, 322 145 C 322 152, 312 152, 313 146 C 314 141, 320 143, 319 147"
 }
];
