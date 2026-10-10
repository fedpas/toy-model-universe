// ganja_fixture_gen.cjs: regenerates ganja_fixture.json, the reference outputs used by pgadyn_selfcheck.py (claims R1-R6).
// Needs ganja.js 1.0.189 (MIT, Steven De Keninck, github.com/enkimute/ganja.js) saved as ./ganja.js next to this file:   node ganja_fixture_gen.cjs
// Inputs are multiples of 1/8 and the arrays are Float64Array, so every double is exact and the Python side compares without a tolerance.
// cross-check fixture: the reference implementation (ganja.js 1.0.189, MIT) evaluated on dyadic inputs, so that doubles are exact
// ganja.js is loaded as text and evaluated as a CommonJS module, so the script also runs inside a project whose package.json says "type": "module"
const _m = { exports: {} }; new Function('module', 'exports', require('fs').readFileSync(__dirname + '/ganja.js', 'utf8')).call(_m.exports, _m, _m.exports);
const Algebra = _m.exports;
let seed = 20261003; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const dy = () => { let v = 0; while (v === 0) v = Math.floor(rnd() * 33 - 16) / 8; return v; };   // multiples of 1/8 in [-2, 2], never 0
const fixtures = {};
for (const d of [1, 2, 3, 4]) {
  const A = Algebra({ p: d, q: 0, r: 1, baseType: Float64Array });
  const N = 1 << (d + 1); const names = [];
  for (let i = 0; i < N; i++) { const e = new A(); e[i] = 1; names.push(e.toString().replace('e_', 'e')); }
  const grade = nm => nm === '1' ? 0 : nm.length - 1;
  const toObj = x => { const o = {}; for (let i = 0; i < N; i++) if (x[i] !== 0) o[names[i]] = x[i]; return o; };
  // a ganja literal for a dictionary {name: coefficient}: 0.25e013 - 1.5e12 + 2
  const lit = o => '(' + (Object.keys(o).map(k => k === '1' ? `(${o[k]})` : `(${o[k]}${k})`).join('+') || '0') + ')';
  const cases = [];
  for (let c = 0; c < 4; c++) {
    const M = {}, B = {};
    names.forEach(nm => { const g = grade(nm); if (g % 2 === 0) M[nm] = dy(); if (g === 2) B[nm] = dy(); });
    const attach = Array.from({ length: d }, dy), pb = Array.from({ length: d }, dy);
    const gdir = d >= 2 ? '1e02' : '1e01';
    const pt = x => `!(1e0 + ${x.map((v, i) => `(${v})*1e${i + 1}`).join(' + ')})`;
    const src = `(()=>{
      var Mx = ${lit(M)}, Bx = ${lit(B)};
      var a = ${pt(attach)}, p = ${pt(pb)};
      var Gravity = !(~Mx >>> (-2 * ${gdir}));
      var Hooke   = 4 * ((~Mx >>> a) & p);
      var Damping = !(-0.25 * Bx);
      var dM = -0.5 * Mx * Bx;
      var dBfree = (-0.5 * (Bx.Dual * Bx - Bx * Bx.Dual)).UnDual;
      var dBfull = (Gravity + Hooke + Damping - 0.5 * (Bx.Dual * Bx - Bx * Bx.Dual)).UnDual;
      var world = Mx >>> p;
      var attachProd = (1 - 0.5 * ${gdir}) * p;
      var attachSand = (1 - 0.5 * ${gdir}) >>> p;
      return { dM, dBfree, dBfull, Gravity, Hooke, Damping, world, a, p, attachProd, attachSand };
    })`;
    const out = Algebra({ p: d, q: 0, r: 1, baseType: Float64Array }, eval(src));
    const res = {}; for (const k in out) res[k] = toObj(out[k]);
    cases.push({ M, B, attach, pb, out: res });
  }
  fixtures[d] = { names, cases };
}

// ---- later rungs (claims R7-R9): the repo's own example code, run verbatim on chosen inputs ---------------------------------------------------------------
// (a) the free-top example (pga3d_physics_free_top): its inertia map I, A, Ai and dState, with the size and the state replaced by the values below.
//     Its numbers are not dyadic (1/12), so the Python side compares with a relative tolerance of 1e-12.
// (b) the planets / moon examples: the acceleration A = (p1,p2,m1,m2) => G m1 m2 / (d d m1) v / d with v = p2 - p1 and d = v.VLength, with G, masses and displacements below.
const later = { top: [], twobody: [] };
{
  const A3 = Algebra({ p: 3, q: 0, r: 1, baseType: Float64Array });
  const N = 16; const names = []; for (let i = 0; i < N; i++) { const e = new A3(); e[i] = 1; names.push(e.toString().replace('e_', 'e')); }
  const toObj = x => { const o = {}; for (let i = 0; i < N; i++) if (x[i] !== 0) o[names[i]] = x[i]; return o; };
  const lit = o => '(' + (Object.keys(o).map(k => k === '1' ? `(${o[k]})` : `(${o[k]}${k})`).join('+') || '0') + ')';
  for (const size of [[0.5, 2, 1], [1, 2, 0.5], [0.75, 1.5, 2]]) {
    const biv = ['e01', 'e02', 'e03', 'e12', 'e13', 'e23'];
    const cases = [];
    for (let c = 0; c < 3; c++) {
      const v = {}; biv.forEach(nm => { v[nm] = dy(); }); const g = { 1: 1 };
      const src = `(()=>{
        var mass = 1, size = ${JSON.stringify(size)};
        var I  = 1/12*mass*this.Bivector(size[0]**2+size[1]**2,size[0]**2+size[2]**2,size[1]**2+size[2]**2,12,12,12),
            A  = (x)=>(0e0+x.Dual).map((x,i)=>x*(I[i]||1)),
            Ai = (x)=>(0e0+x).map((x,i)=>x/(I[i]||1)).Dual;
        var dState = ([g,v])=>[g*v,Ai(A(v)*v-v*A(v))];
        var vv = ${lit(v)}, gg = ${lit({ 1: 0.5, e12: 0.25, e03: -0.125, e0123: 0.5 })};
        var r = dState([gg, vv]);
        var Aout = ${JSON.stringify(biv)}.map(nm => 0);
        return { I, dg: r[0], dv: r[1], gg, vv, ${biv.map(nm => `A_${nm}: A(!(1.0${nm}))`).join(', ')} };
      })`;
      const out = Algebra({ p: 3, q: 0, r: 1, baseType: Float64Array }, eval(src));
      const res = {}; for (const k of ['dg', 'dv', 'gg', 'vv', ...biv.map(nm => 'A_' + nm)]) res[k] = toObj(out[k]); res.I = Array.from(out.I);
      cases.push(res);
    }
    later.top.push({ size, cases });
  }
  // two-body accelerations in R(2,0,1) (the moon example) and R(3,0,1) (the planets example)
  for (const d of [2, 3]) {
    const Ad = Algebra({ p: d, q: 0, r: 1, baseType: Float64Array });
    const Nd = 1 << (d + 1); const nm = []; for (let i = 0; i < Nd; i++) { const e = new Ad(); e[i] = 1; nm.push(e.toString().replace('e_', 'e')); }
    const toO = x => { const o = {}; for (let i = 0; i < Nd; i++) if (x[i] !== 0) o[nm[i]] = x[i]; return o; };
    const data = d === 2
      ? [{ p1: [0, 0], p2: [3, 4], m1: 2, m2: 3, G: 1.5 }, { p1: [1, -2], p2: [6, 10], m1: 5, m2: 1, G: 2 }, { p1: [-4, 3], p2: [-4, -9], m1: 1, m2: 7, G: 0.5 }]
      : [{ p1: [0, 0, 0], p2: [3, 4, 12], m1: 2, m2: 3, G: 1.5 }, { p1: [1, 2, 3], p2: [3, 5, 9], m1: 5, m2: 1, G: 2 }, { p1: [-1, 2, 0], p2: [3, 6, 7], m1: 1, m2: 7, G: 0.5 }];
    const pt = x => `!(1e0 + ${x.map((v, i) => `(${v})*1e${i + 1}`).join(' + ')})`;
    for (const c of data) {
      const src = `(()=>{
        var G = ${c.G}, p1 = ${pt(c.p1)}, p2 = ${pt(c.p2)}, m1 = ${c.m1}, m2 = ${c.m2};
        var A = (p1,p2,m1,m2)=>{ var v=p2-p1, d=v.VLength; return G*m1*m2/(d*d*m1)*v/d; };
        var v = p2 - p1;
        return { a1: A(p1,p2,m1,m2), a2: A(p2,p1,m2,m1), v, d: v.VLength, p1, p2 };
      })`;
      const out = Algebra({ p: d, q: 0, r: 1, baseType: Float64Array }, eval(src));
      later.twobody.push({ n: d, ...c, a1: toO(out.a1), a2: toO(out.a2), v: toO(out.v), d: out.d });
    }
  }
}
fixtures.later = later;
require('fs').writeFileSync('ganja_fixture.json', JSON.stringify(fixtures));
console.log('wrote', Object.keys(fixtures).filter(d => d !== 'later').map(d => d + ':' + fixtures[d].cases.length).join(' '), 'later:', later.top.length + ' tops, ' + later.twobody.length + ' two-body');
console.log('names d=2', JSON.stringify(fixtures[2].names));
console.log('Hooke d=2', JSON.stringify(fixtures[2].cases[0].out.Hooke));
console.log('attachProd d=2', JSON.stringify(fixtures[2].cases[0].out.attachProd), 'p', JSON.stringify(fixtures[2].cases[0].out.p), 'attachSand', JSON.stringify(fixtures[2].cases[0].out.attachSand));
