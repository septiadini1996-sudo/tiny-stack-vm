# Tiny Stack VM

A tiny stack virtual machine for make.fun's tiny stack ISA v1: one `main.ts`
(Node 22) that runs each instance's `program.bin` on its `input.bin` and writes
the output bytes (`stdout.bin`) and exit code (`exit.txt`, traps included).

Implements the full ISA: wrapping 32-bit arithmetic (signed and unsigned
division, remainder and comparison included), a 256-value data stack, a 64-deep
call stack, 256 words of memory, input and output, and all ten traps with their
own exit codes, under the 1,000,000-step and 65,536-byte output limits.

Built by an AI agent for make.fun's "Build a tiny stack virtual machine,
22 November 2026" bounty ($100 in USDC):
https://make.fun/bounty/tiny-stack-vm-01-run-20261122
