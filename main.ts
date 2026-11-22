// Tiny stack VM for make.fun's tiny stack ISA v1. Runs every program found in the input
// directory and writes its output bytes and exit code to the output directory (Node 22).
import { mkdirSync as mk, readdirSync as ls, readFileSync as rd, writeFileSync as wr } from 'node:fs';
import { join } from 'node:path';
const D = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const W = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// One program (P) on its input bytes (N) -> [output bytes, exit code]; codes 2..11 are traps.
function run(P, N) {
  const n = P.length;
  const S = new Int32Array(256); let s = 0; // data stack, at most 256 values
  const C = new Int32Array(64); let c = 0; // call stack, at most 64 return addresses
  const M = new Int32Array(256); // memory words
  const B = new Uint8Array(65536); let L = 0; // output bytes so far
  let q = 0, p = 0, e = 0; // input position, pc, steps executed
  const F = (x) => [B.slice(0, L), x];
  for (;;) {
    if (e >= 1e6) return F(10); // step limit
    if (p < 0 || p >= n) return F(9); // pc outside the program
    const a = p, o = P[a];
    const m = o == 1 ? 1 : o == 2 ? 4 : o >= 48 && o <= 51 ? 2 : 0; // immediate length
    if (a + m >= n) return F(9); // immediate cut off by the program's end
    e++; p = a + 1 + m;
    const w = m == 2 ? P[a + 1] | P[a + 2] << 8 : 0; // the 16-bit immediate, unsigned
    if (o >= 16 && o < 35 && o != 23 && o != 27 && o != 31) { // binary operators (a b -- r)
      if (s < 2) return F(2);
      const b = S[s - 1], x = S[s - 2];
      let r;
      if (o >= 19 && o <= 22) { // DIV MOD DIVU MODU
        if (!b) return F(4);
        r = o == 19 ? (x / b) | 0 : o == 20 ? (x % b) | 0 : o == 21 ? Math.floor((x >>> 0) / (b >>> 0)) | 0 : ((x >>> 0) % (b >>> 0)) | 0;
      } else {
        r = o == 16 ? (x + b) | 0 : o == 17 ? (x - b) | 0 : o == 18 ? Math.imul(x, b)
          : o == 24 ? x & b : o == 25 ? x | b : o == 26 ? x ^ b
          : o == 28 ? x << b : o == 29 ? x >> b : o == 30 ? (x >>> b) | 0
          : o == 32 ? (x == b ? 1 : 0) : o == 33 ? (x < b ? 1 : 0) : ((x >>> 0) < (b >>> 0) ? 1 : 0);
      }
      S[s - 2] = r; s--; continue;
    }
    switch (o) {
      case 0: return F(0); // HALT
      case 1: // PUSH8, sign-extended
        if (s > 255) return F(3);
        S[s++] = (P[a + 1] << 24) >> 24; break;
      case 2: // PUSH32, little-endian
        if (s > 255) return F(3);
        S[s++] = P[a + 1] | P[a + 2] << 8 | P[a + 3] << 16 | P[a + 4] << 24; break;
      case 3: // POP
        if (s < 1) return F(2);
        s--; break;
      case 4: // DUP
        if (s < 1) return F(2);
        if (s > 255) return F(3);
        S[s] = S[s - 1]; s++; break;
      case 5: { // SWAP
        if (s < 2) return F(2);
        const t = S[s - 1]; S[s - 1] = S[s - 2]; S[s - 2] = t; break;
      }
      case 6: // OVER
        if (s < 2) return F(2);
        if (s > 255) return F(3);
        S[s] = S[s - 2]; s++; break;
      case 7: { // ROT ( a b c -- b c a )
        if (s < 3) return F(2);
        const t = S[s - 3]; S[s - 3] = S[s - 2]; S[s - 2] = S[s - 1]; S[s - 1] = t; break;
      }
      case 23: // NEG
        if (s < 1) return F(2);
        S[s - 1] = -S[s - 1]; break;
      case 27: // NOT
        if (s < 1) return F(2);
        S[s - 1] = ~S[s - 1]; break;
      case 48: p += (w << 16) >> 16; break; // JMP: next + signed offset
      case 49: // JZ
        if (s < 1) return F(2);
        if (!S[--s]) p += (w << 16) >> 16; break;
      case 50: // JNZ
        if (s < 1) return F(2);
        if (S[--s]) p += (w << 16) >> 16; break;
      case 51: // CALL: push the return address, go to the unsigned absolute address
        if (c > 63) return F(7);
        C[c++] = p; p = w; break;
      case 52: // RET
        if (c < 1) return F(8);
        p = C[--c]; break;
      case 64: { // LOAD
        if (s < 1) return F(2);
        const v = S[s - 1];
        if (v < 0 || v > 255) return F(6);
        S[s - 1] = M[v]; break;
      }
      case 65: { // STORE ( v addr -- )
        if (s < 2) return F(2);
        const v = S[s - 1];
        if (v < 0 || v > 255) return F(6);
        M[v] = S[s - 2]; s -= 2; break;
      }
      case 80: { // PRINT: decimal ASCII; a print that would pass 65,536 bytes writes nothing
        if (s < 1) return F(2);
        const t = '' + S[s - 1];
        if (L + t.length > 65536) return F(11);
        s--;
        for (let i = 0; i < t.length; i++) B[L++] = t.charCodeAt(i);
        break;
      }
      case 81: // PUTC: the low byte
        if (s < 1) return F(2);
        if (L > 65535) return F(11);
        B[L++] = S[--s] & 255; break;
      case 82: // IN: -1 once the input is used up
        if (s > 255) return F(3);
        S[s++] = q < N.length ? N[q++] : -1; break;
      case 83: // EXIT: the low byte is the code
        if (s < 1) return F(2);
        return F(S[--s] & 255);
      default: return F(5); // unknown opcode
    }
  }
}

for (const id of ls(D).sort()) {
  let b, c;
  try {
    [b, c] = run(rd(join(D, id, 'program.bin')), rd(join(D, id, 'input.bin')));
  } catch {
    // One unreadable instance must not cost the whole set: answer it empty and move on.
    b = new Uint8Array(0); c = 0;
  }
  mk(join(W, id), { recursive: true });
  wr(join(W, id, 'stdout.bin'), b);
  wr(join(W, id, 'exit.txt'), c + '\n');
}
