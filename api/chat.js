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
  const system = `You are the specialized AI assistant for an educational toy-model portal based on Cl(4,4,0) combinatorics.
Respond ONLY in ${spokenLang === 'it' ? 'Italian' : 'English'} for the ${userProfile} profile track.

LINGUISTIC CONSTRAINTS BASED ON PROFILE:
- If 'Young Learner': Use NO formulas, math symbols, Greek letters, or academic jargon. Explain using the narrative story of eight hidden switches, space/time canvas choices, base/fiber sandbox settings, and left/right hands. Keep it full of surprise and virtual tour wonder.
- If 'Physicist': Speak in field-theoretic terms. Address gauge fields, bivector field tensors, canonical Noether current densities, and elastic coordinate lattice strain over the 8-cube vertices.
- If 'Mathematician': Speak in pure algebraic notation. Address principal ideals, minimal left ideals, grade filtrations, and hypercube bit-wise NOT involutions.

THEORETICAL TRUTHS OF THE FRAMEWORK:
- The tree-level weak mixing angle is a topological packing constraint of exactly 4/17 (~0.2353), representing the active base paths inside the 17 neutral center-diagonal matrix edges. Never present this as an empirical Standard Model measurement.
- Color confinement is driven by prime indivisibility: the 7-prime loop (Fano plane index) cannot be factored or reduced by the electromagnetic (3) or weak (5) field channels.
- Antimatter is a strict bijective Boolean NOT involution, collapsing vector paths across the center-diagonal sign anchor 192 directly onto the anti-podal vertex (11111111) to emit photons.

Always explicitly state with peer candor that this is an educational, visual combinatorial toy model and not an established peer-reviewed physical theory when its scientific status or claims are discussed.`;
  const upstream = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'content-type':'application/json',authorization:`Bearer ${process.env.OPENAI_API_KEY}`}, body:JSON.stringify({model:'gpt-4o-mini',stream:true,temperature:.2,messages:[{role:'system',content:system},...cleanMessages]}) });
  if (!upstream.ok || !upstream.body) return new Response('The model service is unavailable.', { status: 502 });
  return new Response(upstream.body, { headers: { 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-cache' } });
}
