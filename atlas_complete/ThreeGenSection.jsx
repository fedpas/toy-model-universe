import React from 'react';
import T from './threegenData.js';
import { THREEGEN_PY } from './threegenSelfcheckSource.js';

const COPY = {
  en: {
    eyebrow: 'THREE GENERATIONS · A TEST OF THE 256', title: 'Can the 256 hold three generations?',
    lede: 'Short answer: by counting dimensions, yes; by counting gauge representations, no. We decompose all 256 real dimensions of End(V) = M₁₆(ℝ) into Standard Model irreps, using the gauge action that Furey’s blocks define, and count how many complete generations fit.',
    sectors: 'Where the 128 complex dimensions go (256 real)',
    bars: [['gauge blocks', 16, 'diag'], ['linear off-diagonal: one generation + replica, all Standard-Model type', 48, 'sm'], ['antilinear: Standard-Model type', 32, 'sm2'], ['antilinear: exotic charges (5/6, 4/3, 2, …)', 32, 'ex']],
    fits: 'Dimension count: one generation with its antiparticles is 16 + 16 complex dimensions, so three would take 96 of the 112 matter dimensions. Also 48 = 3 × 16, but that is a coincidence of capacity: the 48 holds one generation, its conjugate and a partial replica, not three generations.',
    tableH: 'How many copies of each Standard Model irrep the matter part holds', cols: ['irrep', 'linear', 'antilinear', 'total', 'needed for 3'],
    tableNote: 'Linear counts the 48 off-diagonal dimensions. The bottleneck is Q_L = (3,2,+1/6): it appears once, in the linear part, and the antilinear part adds none. ν_R is its own conjugate, so its count includes both directions of one edge.',
    searchH: 'Could another block structure do better?',
    search1: n => `We tried every 8-dimensional structure built from singlets, doublets, triplets and anti-triplets with Standard Model hypercharges (${n} of them). The most complete generations any of them holds is 2. Furey’s own structure holds 1.`,
    search2: n => `Keeping Furey’s block sizes (1,3,2,1,1) and only changing the hypercharges (${n} choices): 1 generation at best with Standard Model content, 2 only with at least 32 complex dimensions of exotic charges.`,
    verdictH: 'What this says',
    verdict: ['The linear off-diagonal part is exactly Standard-Model type and holds one generation plus a partial replica (d_R, two L, e_R): checked.', 'Three complete generations do not fit the gauge-representation content of Cl(0,8) in any admissible block structure: checked, with the limits of the search stated below.', 'So a family structure for generations has to come from somewhere outside the gauge action. That is open, and we do not claim it.'],
    limits: 'Limits of the search: blocks of size 1, 2 and 3 (singlet, doublet, triplet, anti-triplet), hypercharges up to |y| = 2, generations counted as copies of the six irreps in the matter part (linear off-diagonal plus antilinear). It does not test family symmetries, other representations of Cl(0,8), or a different identification of fermions with operators.',
    dlH: 'Check it yourself', dlText: 'One self-contained Python file (standard library only). It rebuilds the decomposition, the counts and both searches.', dlPy: 'Download threegen_selfcheck.py', dlJson: 'Download threegen.json', dlCmd: 'python3 threegen_selfcheck.py --compare threegen.json',
    tags: [['checked', 'decomposition and counts'], ['checked', 'exhaustive search over the stated structures'], ['open', 'a family structure outside the gauge action']]
  },
  it: {
    eyebrow: 'TRE GENERAZIONI · UNA PROVA SUI 256', title: 'I 256 possono contenere tre generazioni?',
    lede: 'Risposta breve: contando le dimensioni sì; contando le rappresentazioni di gauge no. Scomponiamo tutte le 256 dimensioni reali di End(V) = M₁₆(ℝ) in irreps del Modello Standard, usando l’azione di gauge definita dai blocchi di Furey, e contiamo quante generazioni complete ci stanno.',
    sectors: 'Dove vanno le 128 dimensioni complesse (256 reali)',
    bars: [['blocchi di gauge', 16, 'diag'], ['lineare fuori diagonale: una generazione + replica, tutto di tipo Modello Standard', 48, 'sm'], ['antilineare: tipo Modello Standard', 32, 'sm2'], ['antilineare: cariche esotiche (5/6, 4/3, 2, …)', 32, 'ex']],
    fits: 'Conto delle dimensioni: una generazione con le sue antiparticelle sono 16 + 16 dimensioni complesse, quindi tre ne richiederebbero 96 delle 112 dimensioni di materia. Inoltre 48 = 3 × 16, ma è una coincidenza di capacità: i 48 contengono una generazione, la sua coniugata e una replica parziale, non tre generazioni.',
    tableH: 'Quante copie di ogni irrep del Modello Standard contiene la parte di materia', cols: ['irrep', 'lineare', 'antilineare', 'totale', 'servono per 3'],
    tableNote: 'Lineare conta le 48 dimensioni fuori diagonale. Il collo di bottiglia è Q_L = (3,2,+1/6): compare una sola volta, nella parte lineare, e quella antilineare non ne aggiunge. ν_R è coniugato di sé stesso, quindi il suo conteggio include entrambe le direzioni di uno stesso spigolo.',
    searchH: 'Un’altra struttura a blocchi farebbe meglio?',
    search1: n => `Abbiamo provato ogni struttura a 8 dimensioni fatta di singoletti, doppietti, tripletti e anti-tripletti con ipercariche del Modello Standard (${n} in tutto). Il massimo di generazioni complete che una di esse contiene è 2. La struttura di Furey ne contiene 1.`,
    search2: n => `Tenendo le dimensioni dei blocchi di Furey (1,3,2,1,1) e cambiando solo le ipercariche (${n} scelte): al meglio 1 generazione con contenuto del Modello Standard, 2 solo con almeno 32 dimensioni complesse di cariche esotiche.`,
    verdictH: 'Che cosa dice',
    verdict: ['La parte lineare fuori diagonale è esattamente di tipo Modello Standard e contiene una generazione più una replica parziale (d_R, due L, e_R): verificato.', 'Tre generazioni complete non stanno nel contenuto di rappresentazioni di gauge di Cl(0,8) in nessuna struttura a blocchi ammissibile: verificato, entro i limiti della ricerca indicati sotto.', 'Quindi una struttura di famiglia per le generazioni deve venire da fuori dell’azione di gauge. È aperto e non lo affermiamo.'],
    limits: 'Limiti della ricerca: blocchi di dimensione 1, 2 e 3 (singoletto, doppietto, tripletto, anti-tripletto), ipercariche fino a |y| = 2, generazioni contate come copie dei sei irreps nella parte di materia (lineare fuori diagonale più antilineare). Non prova simmetrie di famiglia, altre rappresentazioni di Cl(0,8) né un’altra identificazione dei fermioni con gli operatori.',
    dlH: 'Verificalo tu', dlText: 'Un unico file Python autonomo (solo libreria standard). Ricostruisce la scomposizione, i conteggi e le due ricerche.', dlPy: 'Scarica threegen_selfcheck.py', dlJson: 'Scarica threegen.json', dlCmd: 'python3 threegen_selfcheck.py --compare threegen.json',
    tags: [['checked', 'scomposizione e conteggi'], ['checked', 'ricerca esaustiva sulle strutture indicate'], ['open', 'una struttura di famiglia fuori dall’azione di gauge']]
  }
};
const TAGCOL = { checked: '#34d399', open: '#f87171' };
const BARCOL = { diag: '#8b93a7', sm: '#34d399', sm2: '#60a5fa', ex: '#f87171' };
function download(name, text, type) { try { const b = new Blob([text], { type }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { /* ignore */ } }
const STYLE = `.tg{max-width:900px;margin:28px auto;padding:0 16px}.tg h3{margin:1.2em 0 .4em}.tg-card{border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:12px 14px;margin:10px 0}.tg table{border-collapse:collapse;width:100%;font-size:.88em}.tg th,.tg td{text-align:left;padding:3px 8px;border-bottom:1px solid rgba(128,128,128,.25)}.tg .mono{font-family:ui-monospace,Menlo,monospace}.tg-tag{display:inline-block;margin:2px 6px 2px 0;padding:1px 8px;border-radius:6px;border:1px solid;font-size:.78em}.tg-cap{font-size:.85em;opacity:.8}.tg-btn{background:none;border:1px solid rgba(128,128,128,.5);border-radius:8px;padding:6px 12px;color:inherit;cursor:pointer;font:inherit;margin:4px 8px 4px 0}`;

export default function ThreeGenSection({ lang = 'en', profile = 'Young Learner' }) {
  const t = COPY[lang] || COPY.en, rows = ['Q_L', 'u_R', 'd_R', 'L', 'e_R', 'nu_R'].map(n => [n, T.sm_rows[n]]), W = 620, tot = 128;
  let x = 0;
  return <section className="tg" aria-labelledby="tg-h"><style>{STYLE}</style>
    <p className="eyebrow">{t.eyebrow}</p><h2 id="tg-h">{t.title}</h2><p className="lede">{t.lede}</p>
    <div>{t.tags.map(([k, s]) => <span key={s} className="tg-tag" style={{ color: TAGCOL[k] }}>{k === 'checked' ? (lang === 'it' ? 'verificato' : 'checked') : (lang === 'it' ? 'aperto' : 'open')} · {s}</span>)}</div>
    <h3>{t.sectors}</h3>
    <div className="tg-card">
      <svg viewBox={`0 0 ${W} 54`} role="img" aria-label={t.sectors} style={{ width: '100%' }}>
        {t.bars.map(([l, n, c]) => { const w = n / tot * (W - 4), r = <rect key={l} x={2 + x} y="6" width={w - 2} height="30" rx="4" fill={BARCOL[c]} fillOpacity=".75" />; const tx = x; x += w; return <g key={l}>{r}<text x={2 + tx + (w - 2) / 2} y="26" textAnchor="middle" fontSize="13" fill="#0b1020">{n}ℂ</text></g>; })}
        <text x="2" y="50" fontSize="10" fill="currentColor" opacity=".7">0</text><text x={W - 2} y="50" fontSize="10" textAnchor="end" fill="currentColor" opacity=".7">128ℂ = 256 ℝ</text>
      </svg>
      {t.bars.map(([l, n, c]) => <p key={l} className="tg-cap" style={{ margin: '2px 0' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: BARCOL[c], marginRight: 6 }} />{l} ({n}ℂ)</p>)}
      <p>{t.fits}</p>
    </div>
    <h3>{t.tableH}</h3>
    <div className="tg-card"><table><thead><tr>{t.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
      {rows.map(([n, r]) => <tr key={n}><td className="mono">{n.replace('nu_R', 'ν_R')} {r.rep}</td><td>{r.linear}</td><td>{r.antilinear}</td><td>{r.linear + r.antilinear}</td><td>3</td></tr>)}</tbody></table>
      <p className="tg-cap">{t.tableNote}</p></div>
    <h3>{t.searchH}</h3>
    <div className="tg-card"><p>{t.search1(T.search_all.admissible_W)}</p>
      <p className="mono tg-cap">{Object.entries(T.search_all.histogram).map(([g, n]) => `${g} generations: ${n}`).join(' · ')}</p>
      <p>{t.search2(T.search_peirce_frame.assignments)}</p>
      <p className="mono tg-cap">{Object.entries(T.search_peirce_frame.histogram).map(([g, n]) => `${g} generations: ${n}`).join(' · ')}</p></div>
    <h3>{t.verdictH}</h3>
    <div className="tg-card">{t.verdict.map(v => <p key={v}>{v}</p>)}<p className="tg-cap">{t.limits}</p></div>
    <h3>{t.dlH}</h3><p>{t.dlText}</p>
    <div><button className="tg-btn" onClick={() => download('threegen_selfcheck.py', THREEGEN_PY, 'text/x-python')}>{t.dlPy}</button><button className="tg-btn" onClick={() => download('threegen.json', JSON.stringify(T, null, 1), 'application/json')}>{t.dlJson}</button></div>
    <p className="mono tg-cap">{t.dlCmd}</p>
  </section>;
}
