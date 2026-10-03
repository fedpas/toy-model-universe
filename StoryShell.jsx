import React, { useEffect, useState } from 'react';

// One story, five pages. Every page says what the previous page showed, what it does, and what it hands on.
// Status vocabulary used everywhere: checked (exact arithmetic or script), standard (textbook mathematics),
// ours (the reading we propose), open (not established).
import { PAGES, STORY } from './storyCopy.js';
import { Intro } from './Fold.jsx';
import { pageEyebrow } from './steps.js';
export { PAGES, STORY };

const STYLE = `
.story-nav{position:sticky;top:0;z-index:20;display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px 16px;background:var(--bg,#0b1020);border-bottom:1px solid rgba(128,128,128,.3)}
.story-nav .brand{margin-right:12px;font-weight:600;text-decoration:none;color:inherit}
.story-nav button{background:none;border:1px solid rgba(128,128,128,.4);border-radius:999px;padding:4px 12px;color:inherit;cursor:pointer;font:inherit;font-size:.85em}
.story-nav button.active{background:rgba(80,170,255,.2);border-color:#4aa8ff}
.page-intro{max-width:900px;margin:24px auto 8px;padding:0 16px}
.page-intro h2{margin:.2em 0}
.page-intro .before{opacity:.7;font-size:.9em;margin:.2em 0}
.tag{display:inline-block;margin:2px 6px 2px 0;padding:1px 8px;border-radius:6px;border:1px solid;font-size:.78em;white-space:nowrap}
.tag.checked{color:#34d399}.tag.standard{color:#60a5fa}.tag.ours{color:#fbbf24}.tag.open{color:#f87171}
.page-tags .tag{white-space:normal;display:block;max-width:100%;overflow-wrap:anywhere}
.page-tags{margin:8px 0}
.page-tags details{font-size:.8em;opacity:.85}
.eq-fold{margin:12px 0}.eq-fold>summary{cursor:pointer;font-weight:600;padding:6px 0}.eq-short{font-size:1.05em}.page-intro .lede{font-size:1em;margin:.4em 0}.page-intro .eq-fold>summary{cursor:pointer;font-weight:600}
.story-pager{display:flex;justify-content:space-between;gap:16px;max-width:900px;margin:32px auto;padding:16px;border-top:1px solid rgba(128,128,128,.3)}
.story-pager button{background:none;border:1px solid rgba(128,128,128,.5);border-radius:8px;padding:8px 14px;color:inherit;cursor:pointer;font:inherit;text-align:left;max-width:48%}
.story-pager small{display:block;opacity:.75;margin-top:4px}
`;

export function usePage() {
  const read = () => { const h = (typeof location !== 'undefined' ? location.hash : '').replace('#', ''); return PAGES.includes(h) ? h : 'rule'; };
  const [page, setPageState] = useState(read);
  useEffect(() => { const f = () => setPageState(read()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const setPage = p => { try { history.replaceState(null, '', '#' + p); } catch { /* ignore */ } setPageState(p); if (typeof window !== 'undefined') window.scrollTo?.(0, 0); };
  return [page, setPage];
}

export function StoryNav({ lang, page, setPage }) {
  const s = STORY[lang] || STORY.en;
  return <><style>{STYLE}</style><nav className="story-nav" aria-label="Story pages"><a className="brand" href="#rule" onClick={() => setPage('rule')}><span>01</span> CASCADE ATLAS</a>
    {PAGES.map((p, i) => <button key={p} className={p === page ? 'active' : ''} aria-current={p === page ? 'page' : undefined} onClick={() => setPage(p)}>{i + 1} · {s.nav[p]}</button>)}</nav></>;
}

export function PageIntro({ lang, page, profile = 'Mathematician' }) {
  const s = STORY[lang] || STORY.en, p = s.pages[page], i = PAGES.indexOf(page);
  return <section className="page-intro"><p className="eyebrow">{pageEyebrow(lang in STORY ? lang : 'en', i + 1, PAGES.length)}</p><h2>{p.h}</h2>
    {p.before && <p className="before"><b>{s.before}:</b> {p.before}</p>}
    <Intro lang={lang} profile={profile} id={'page_' + page} lede={p.does} />
    <div className="page-tags">{p.tags.map(([k, txt]) => <span key={txt} className={'tag ' + k} title={s.tagHelp[k]}>{s.tags[k]} · {txt}</span>)}
      <details><summary>{s.legend}</summary>{Object.keys(s.tags).map(k => <p key={k}><span className={'tag ' + k}>{s.tags[k]}</span> {s.tagHelp[k]}</p>)}</details></div></section>;
}

export function StoryPager({ lang, page, setPage }) {
  const s = STORY[lang] || STORY.en, i = PAGES.indexOf(page), prev = PAGES[i - 1], next = PAGES[i + 1];
  return <div className="story-pager"><div>{prev && <button onClick={() => setPage(prev)}>← {s.prev}: {s.nav[prev]}</button>}</div>
    <div>{next && <button onClick={() => setPage(next)}>{s.next}: {s.nav[next]} →<small>{s.pages[page].after}</small></button>}</div></div>;
}
