// Benchmark of the label claims of step 13 (G1-G4 of pgadyn_selfcheck.py are exact; this file times them).  node bench_labels.mjs [--quick] [--write bench_labels.json]
// Method: for every n the variants are first checked to give the same answers; then each is timed in batches (a batch lasts at least 60 ms), 7 batches, and the median batch is reported
// with the fastest and slowest batch. Nothing here is exact and nothing is a claim about other machines.
import os from 'node:os';
import fs from 'node:fs';
import { runBench, checkAll } from '../benchKernels.js';
const quick = process.argv.includes('--quick'), wi = process.argv.indexOf('--write');
const now = () => Number(process.hrtime.bigint()) / 1e6;
const fmt = r => r ? (r.med >= 1e4 ? (r.med / 1e3).toFixed(1) + ' us' : r.med.toFixed(0) + ' ns') : '-';
const ratio = (a, b) => a && b ? (a.med / b.med).toFixed(2) + 'x' : '-';
const spread = r => r ? ((r.max - r.min) / r.med * 100).toFixed(0) + '%' : '-';
const info = { node: process.version, platform: `${os.platform()} ${os.arch()}`, cpu: os.cpus()[0].model, cores: os.cpus().length, date: new Date().toISOString().slice(0, 10), minMs: quick ? 20 : 60, reps: quick ? 5 : 7 };
console.log(`node ${info.node} on ${info.platform}, ${info.cpu} (${info.cores} cores); batches >= ${info.minMs} ms, ${info.reps} batches, median reported\n`);
const rows = runBench({ now, minMs: info.minMs, reps: info.reps });
const line = (h, f) => { console.log(h.padEnd(34) + rows.map(r => f(r).padStart(11)).join('')); };
line('n', r => String(r.n)); line('sandwiches direct / frame', r => `${r.sandwichesDirect}/${r.sandwichesFrame}`);
console.log('\n(1) the 2^n world vertices from a motor');
line('direct (2^n sandwiches)', r => fmt(r.ns.direct)); line('frame (n+1 sandwiches + adds)', r => fmt(r.ns.frame)); line('  direct / frame', r => ratio(r.ns.direct, r.ns.frame)); line('frame, then n^2 flops a vertex', r => fmt(r.ns.matrix)); line('  matrix / frame', r => ratio(r.ns.matrix, r.ns.frame)); line('table step alone: doubling', r => fmt(r.ns.doubling)); line('table step alone: n^2 a vertex', r => fmt(r.ns.matrixGiven)); line('  n^2 / doubling', r => ratio(r.ns.matrixGiven, r.ns.doubling)); line('frame with mirrored odd half', r => fmt(r.ns.mirror)); line('  frame / mirror', r => ratio(r.ns.frame, r.ns.mirror)); line('  spread of the frame batches', r => spread(r.ns.frame));
console.log('\n(2) the deepest vertex under a plane');
line('scan of a given table (2^n dots)', r => fmt(r.ns.scan)); line('n sign bits of a given frame', r => fmt(r.ns.bits)); line('  scan / bits', r => ratio(r.ns.scan, r.ns.bits));
line('build table, then scan', r => fmt(r.ns.scanBuilt)); line('build frame, then bits', r => fmt(r.ns.bitsBuilt)); line('  scan+build / bits+build', r => ratio(r.ns.scanBuilt, r.ns.bitsBuilt));
console.log('\n(3) the flat outline (2n vertices)');
line('hull of the 2^n projected points', r => fmt(r.ns.hull)); line('zonogon from n projected edges', r => fmt(r.ns.zono)); line('  hull / zonogon', r => ratio(r.ns.hull, r.ns.zono));
line('table + project + hull', r => fmt(r.ns.hullBuilt)); line('frame + project + zonogon', r => fmt(r.ns.zonoBuilt)); line('  hull+build / zonogon+build', r => ratio(r.ns.hullBuilt, r.ns.zonoBuilt));
if (wi > 0) { fs.writeFileSync(process.argv[wi + 1], JSON.stringify({ machine: info, rows }, null, 1)); console.log('\nwrote', process.argv[wi + 1]); }
