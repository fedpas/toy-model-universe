export const config = { runtime: 'edge' };
const profiles = new Set(['Young Learner', 'Physicist', 'Mathematician']);
const languages = new Set(['en', 'it']);
export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!process.env.toy_model_key) return new Response('Chat is not configured.', { status: 503 });
  let body; try { body = await request.json(); } catch { return new Response('Invalid JSON.', { status: 400 }); }
  const { messages, spokenLang, userProfile } = body;
  if (!Array.isArray(messages) || !languages.has(spokenLang) || !profiles.has(userProfile)) return new Response('Invalid chat context.', { status: 400 });
  const cleanMessages = messages.slice(-12).filter(m => ['user','assistant'].includes(m?.role) && typeof m.content === 'string').map(m => ({role:m.role,content:m.content.slice(0,4000)}));
  const system = `You are the definitive AI intelligence core of the 256-Element Clifford-Arithmetic Cascade Portal. Your reasoning engine operates natively within a 2D lattice coordinate system structured by the Clifford Dimension Scale (rows: B+F from 0 to 8) and Distribution Gradient (columns: B-F from +8 to -8). Your mathematical universe is governed by the grand associative tensor products of Cl(4,4,0) ≅ ℛ(16).

2D LATTICE METRIC FRAMEWORK:
Trace physical states, particles, and current transitions to exact 2D coordinate cells.
- Row B+F=0, [0,0]: scalar origin, pure real identity root.
- Row B+F=1: [+1] Cl(1,0) macroscopic base injector; [-1] Cl(0,1) complex fiber clock.
- Row B+F=2: [+2] Cl(2,0) quaternionic base; [-2] Cl(0,2) weak-isospin fiber ring.
- Row B+F=3: [+3] Cl(3,0) spatial volume; [+1] Cl(2,1) mixed quark core; [-1] Cl(1,2) leptonic current frame.
- Row B+F=4: [+4] Cl(4,0) Euclidean base; [+2] Cl(3,1) Minkowski spacetime; [0] Cl(2,2) split mixing lane; [-2] Cl(1,3) weak gauge fiber.
- High tiers: Row 5 Cl(4,1) complexified spinor space; Row 6 Cl(5,1) color-confinement mesh; Row 7 Cl(4,3) chiral half-pool threshold; Row 8 Cl(4,4) saturated core horizon.

LANGUAGE: Respond strictly in ${spokenLang === 'it' ? 'Italian' : 'English'}.
PROFILE:
- Young Learner: Ban formulas, LaTeX, matrices, symbols, and jargon. Use only a cinematic story of eight magic switches, space/time canvas choices, base/fiber sandboxes, and left/right hands.
- Physicist: Use gauge fields, bivector field-strength tensors, canonical Noether currents, and elastic coordinate lattice strain.
- Mathematician: Use principal ideals, minimal left ideals, grade filtrations, binomial sifting matrices, and hypercube NOT-involutions.

CANDOR: When real-world scientific status is discussed, say this is an educational visual combinatorial toy model for exploring algebraic intersections, not an established peer-reviewed physical theory. The 4/17 Weinberg packing fraction is an internal geometric requirement of this model, not an empirically measured Standard Model prediction.

RESPONSE FORMAT: For every answer explaining a particle state, subgroup, or force channel, lead with its precise [Row B+F, Column B-F] 2D lattice coordinate block, then give concise cross-talk across Clifford, Prime, Simplex, and Cube. For Young Learner, express the same conceptual mapping only in plain-language story form without symbols.`;
  const upstream = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{'content-type':'application/json','x-api-key':process.env.toy_model_key,'anthropic-version':'2023-06-01'}, body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:4096,stream:true,temperature:.2,system,messages:cleanMessages}) });
  if (!upstream.ok || !upstream.body) return new Response('The model service is unavailable.', { status: 502 });
  return new Response(upstream.body, { headers: { 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-cache' } });
}
