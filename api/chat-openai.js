export const config = { runtime: 'edge' };
const profiles = new Set(['Young Learner', 'Physicist', 'Mathematician']);
const languages = new Set(['en', 'it']);
const metrics = new Set(['Spatial', 'Temporal']);

export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!process.env.ToyModelKeyOpenAi) return new Response('Chat is not configured.', { status: 503 });
  let body;
  try { body=await request.json(); } catch { return new Response('Invalid JSON.', {status:400}); }
  const {messages,spokenLang,userProfile,metricMode,isMatchMode=false}=body;
  if (!Array.isArray(messages)||!languages.has(spokenLang)||!profiles.has(userProfile)||!metrics.has(metricMode)) return new Response('Invalid chat context.', {status:400});
  const cleanMessages=messages.slice(-12).filter(m=>['user','assistant'].includes(m?.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,4000)}));
  const system=`You are the OpenAI comparison assistant for the educational 256-Element Clifford-Arithmetic Cascade Portal, a toy model based on Cl(4,4,0). Active metric mode: ${metricMode}. ${metricMode==='Temporal'?'Time is the active Chronos-Manifold; space is a localized grade restriction. Treat [3,+3] as a volumetric time block and [8,0] as the balanced chrono-intersect.':'Space-time is the passive geometric background; treat [3,+3] as spatial volume and [8,0] as the electroweak core.'} Use Cohl Furey regular representation language: left actions govern fiber gauge metrics, right actions govern base spacetime, and bimodule actions bridge the center diagonal. Respond only in ${spokenLang==='it'?'Italian':'English'} for ${userProfile}. Young Learner: no formulas, symbols, or jargon. Physicist: gauge connections, bivectors, Noether currents, strain or chrono-compression. Mathematician: ideals, filtrations, and Boolean NOT involutions. Always call this an educational toy model, not established peer-reviewed physics; 4/17 is internal, not a Standard Model measurement. Mention limitations when relevant: mass scale, RGE running, CKM drift, and continuum limit. Lead analytic answers with [Row B+F, Column B-F], then cross-talk across Clifford, Prime, Simplex, and Cube.${isMatchMode ? `\n\nMATCH MODE PROTOCOL (THE FUREY SUPERALGEBRA CHALLENGE):
When isMatchMode is active, the user is submitting an adversarial research problem based on N. Furey's arXiv:2505.07923 concerning Z₂⁵-graded superalgebra representations of light particles. Independently audit its Bits [0–4] subspace against this portal's Cl(4,4,0) 2D-grid axioms, Bits [0–7], and 256-dimensional real space. Analyze the proposed exclusion of the Top Quark, then reason from first principles whether extending to the 8-bit lattice addresses that exclusion. Derive the relevant [Row B+F, Column B-F] truncation and completion sectors using only the portal's geometric-algebraic conventions; do not invoke external empirical values. Preserve intellectual candor: this is a toy-model comparison, so do not claim the analysis proves a Standard Model particle identity or validates either framework as established physics.` : ''}`;
  try {
    const upstream=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${process.env.ToyModelKeyOpenAi}`},body:JSON.stringify({model:'o3',stream:true,max_completion_tokens:4096,messages:[{role:'system',content:system},...cleanMessages]})});
    if(!upstream.ok||!upstream.body) {
      const detail=(await upstream.text()).slice(0,500);
      console.error('OpenAI upstream error',upstream.status,detail);
      return new Response('The model service is unavailable.',{status:502});
    }
    return new Response(upstream.body,{headers:{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache'}});
  } catch(error) { console.error('OpenAI gateway failure:',error); return new Response('The model service is unavailable.',{status:502}); }
}
