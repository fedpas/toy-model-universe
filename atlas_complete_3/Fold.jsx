import React, { useState, useEffect } from 'react';
import { SHORT, FOLD, level } from './audienceCopy.js';

// A folded block. The reading level decides whether it starts open; the reader can always toggle it.
export function Fold({ title, open = false, children, nested = false }) {
  const [o, setO] = useState(open);
  useEffect(() => setO(open), [open]);
  return <details className={'eq-fold' + (nested ? ' eq-fold-in' : '')} open={o} onToggle={e => setO(e.currentTarget.open)}><summary className="eq-sum">{title}</summary>{children}</details>;
}
// The introduction: the mathematician reads it in full; the other two read a short version, and the full text is one click away.
export function Intro({ lang, profile, id, lede }) {
  const lv = level(profile), sh = (SHORT[lang] || SHORT.en)[id]?.[lv];
  if (lv === 2 || !sh) return <p className="lede">{lede}</p>;
  return <><p className="lede eq-short" data-level={lv}>{sh}</p><Fold title={(FOLD[lang] || FOLD.en).full} open={false}><p className="lede">{lede}</p></Fold></>;
}
export { level };
