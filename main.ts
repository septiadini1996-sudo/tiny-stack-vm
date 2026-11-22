import { readdirSync as R, readFileSync as F, mkdirSync as M, writeFileSync as W } from 'node:fs';
import { join as J } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
function run(P, N) {
  const S = new Int32Array(256), M = new Int32Array(256), C = [], o = new Uint8Array(65536), L = P.length;
  let l = 0, s = 0, p = 0, q = 0, n = 0, a = 0, b = 0;
  const X = (c) => { throw c; };
  try {
    for (;;) {
      if (n >= 1e6) X(10);
      if (p < 0 || p >= L) X(9);
      const op = P[p];
      switch (op) {
        case 0: X(0);
        case 1: p + 2 > L && X(9); s > 255 && X(3); S[s++] = P[p + 1] << 24 >> 24; p += 2; break;
        case 2: p + 5 > L && X(9); s > 255 && X(3); S[s++] = P[p + 1] | P[p + 2] << 8 | P[p + 3] << 16 | P[p + 4] << 24; p += 5; break;
        case 3: s < 1 && X(2); s--; p++; break;
        case 4: s < 1 && X(2); s > 255 && X(3); S[s] = S[s - 1]; s++; p++; break;
        case 5: s < 2 && X(2); a = S[s - 1]; S[s - 1] = S[s - 2]; S[s - 2] = a; p++; break;
        case 6: s < 2 && X(2); s > 255 && X(3); S[s] = S[s - 2]; s++; p++; break;
        case 7: s < 3 && X(2); a = S[s - 3]; S[s - 3] = S[s - 2]; S[s - 2] = S[s - 1]; S[s - 1] = a; p++; break;
        case 16: case 17: case 18: case 19: case 20: case 21: case 22:
        case 24: case 25: case 26: case 28: case 29: case 30: case 32: case 33: case 34:
          s < 2 && X(2); b = S[--s]; a = S[s - 1];
          op > 18 && op < 23 && !b && X(4);
          S[s - 1] = op === 16 ? a + b : op === 17 ? a - b : op === 18 ? Math.imul(a, b) :
            op === 19 ? Math.trunc(a / b) : op === 20 ? a % b : op === 21 ? Math.floor((a >>> 0) / (b >>> 0)) :
            op === 22 ? (a >>> 0) % (b >>> 0) : op === 24 ? a & b : op === 25 ? a | b : op === 26 ? a ^ b :
            op === 28 ? a << b : op === 29 ? a >> b : op === 30 ? a >>> b : op === 32 ? (a === b ? 1 : 0) :
            op === 33 ? (a < b ? 1 : 0) : (a >>> 0) < (b >>> 0) ? 1 : 0;
          p++; break;
        case 23: case 27: s < 1 && X(2); S[s - 1] = op === 23 ? -S[s - 1] : ~S[s - 1]; p++; break;
        case 48: case 49: case 50:
          p + 3 > L && X(9); a = (P[p + 1] | P[p + 2] << 8) << 16 >> 16; p += 3;
          if (op === 48) p += a; else { s < 1 && X(2); if ((S[--s] === 0) === (op === 49)) p += a; }
          break;
        case 51: p + 3 > L && X(9); C.length > 63 && X(7); C.push(p + 3); p = P[p + 1] | P[p + 2] << 8; break;
        case 52: C.length === 0 && X(8); p = C.pop(); break;
        case 64: s < 1 && X(2); a = S[s - 1]; (a < 0 || a > 255) && X(6); S[s - 1] = M[a]; p++; break;
        case 65: s < 2 && X(2); a = S[s - 1]; (a < 0 || a > 255) && X(6); M[a] = S[s - 2]; s -= 2; p++; break;
        case 80: { s < 1 && X(2); const w = String(S[--s]); l + w.length > 65536 && X(11); for (let i = 0; i < w.length;) o[l++] = w.charCodeAt(i++); p++; break; }
        case 81: s < 1 && X(2); l > 65535 && X(11); o[l++] = S[--s] & 255; p++; break;
        case 82: s > 255 && X(3); S[s++] = q < N.length ? N[q++] : -1; p++; break;
        case 83: s < 1 && X(2); X(S[s - 1] & 255);
        default: X(5);
      }
      n++;
    }
  } catch (c) { return [o.subarray(0, l), c]; }
}
for (const d of R(I)) {
  const r = run(F(J(I, d, 'program.bin')), F(J(I, d, 'input.bin')));
  M(J(O, d), { recursive: true });
  W(J(O, d, 'stdout.bin'), r[0]);
  W(J(O, d, 'exit.txt'), String(r[1]));
}
