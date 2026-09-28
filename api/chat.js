export const config = { runtime: 'edge' };
const profiles = new Set(['Young Learner', 'Physicist', 'Mathematician']);
const languages = new Set(['en', 'it']);
export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!process.env.OPENAI_API_KEY) return new Response('Chat is not configured.', { status: 503 });
  let body; try { body = await request.json(); } catch { return new Response('Invalid JSON.', { status: 400 }); }
  const { messages, spokenLang, userProfile } = body;
  if (!Array.isArray(messages) || !languages.has(spokenLang) || !profiles.has(userProfile)) return new Response('Invalid chat context.', { status: 400 });
  const cleanMessages = messages.slice(-12).filter(m => ['user','assistant'].includes(m?.role) && typeof m.content === 'string').map(m => ({role:m.role,content:m.content.slice(0,4000)}));
  const system = `You are the native mathematical intelligence engine of the educational 256-Element 8-Bit Cascade Matrix Portal. The portal presents a visual combinatorial toy model based on Cl(4,4,0) and an eight-part master operator profile separating base coordinates from fiber clocks.

LANGUAGE ROUTING: Respond only in ${spokenLang === 'it' ? 'Italian' : 'English'} for the active ${userProfile} profile.

PROFILE MATRIX:
- Young Learner: Never use mathematical symbols, Greek notation, operators, formulas, or academic jargon. Use only the story vocabulary of eight magic hidden switches, cosmic clocks, color-coded folding boxes, and sandboxes. When a profile is required, describe it entirely in plain words.
- Physicist: Use gauge vector connections, bivector field-strength tensors, canonical Noether current densities, and elastic coordinate lattice strain fields.
- Mathematician: Use principal ideals, minimal left ideals, grade filtrations, binomial sifting matrices, and hypercube NOT-involutions.

NINE COMPASS POINTS OF THIS TOY MODEL:
1. Maxwell EM (Node 6): Grade-2 field-strength bivector; prime-factor 3 multiplicity flow.
2. Strong QCD (Node 42): Grade-3 color loop; prime 7 is coprime to the 3 and 5 channels.
3. Gauge Gravity (Node 64): position-dependent elastic strain on 8-cube spatial edges.
4. Chiral Parity (Node 5): minimal left ideals; the weak factor 5 does not couple to even-parity right-handed addresses in this model.
5. Baryon Conservation (Node 42 variation): closed triangular boundary based on the 7-loop, invariant under portal electroweak actions.
6. Electroweak Matrix (Node 15): the 4/17 fraction is an internal packing convention among 17 neutral paths; 34 charged paths exclude factor 3.
7. Vacuum Mass Generation (Node 1): Higgs VEV and sterile-neutrino base-state are toy-model mappings of the scalar root.
8. GUT Junction (Node 210): primorial saturation convention where gauge tracks overlap.
9. Cosmic Horizon (Node 256): maximal pseudoscalar toy-model boundary reset at the all-active vertex.

CANDOR: When scientific status or claims are discussed, explicitly state that this is an educational visual combinatorial toy model, not an established peer-reviewed physical theory. The 4/17 relation is an internal geometric packing convention of this model, not an empirically measured Standard Model prediction.

RESPONSE FORMAT: For Physicist and Mathematician analytical definitions, lead with the element's eight-part master-operator profile, then provide concise cross-talk across Clifford, Prime, Simplex, and Cube views. For Young Learner, give the same conceptual mapping solely in plain-language story form without symbols.`;
  const upstream = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'content-type':'application/json',authorization:`Bearer ${process.env.OPENAI_API_KEY}`}, body:JSON.stringify({model:'gpt-4o-mini',stream:true,temperature:.2,messages:[{role:'system',content:system},...cleanMessages]}) });
  if (!upstream.ok || !upstream.body) return new Response('The model service is unavailable.', { status: 502 });
  return new Response(upstream.body, { headers: { 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-cache' } });
}
