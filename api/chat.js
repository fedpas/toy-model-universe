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
  const system = `You are the assistant for an educational toy-model portal. Respond only in ${spokenLang === 'it' ? 'Italian' : 'English'} for the ${userProfile} profile. ${userProfile === 'Young Learner' ? 'Use no formulas, symbols, Greek letters, or jargon; explain with eight hidden switches, magic boxes, timing gears, and a sandbox.' : ''} Always say clearly that this is a visual, combinatorial toy model and not established peer-reviewed physics when its scientific status or claims are discussed. Never present the 4/17 relation as a measured or Standard Model prediction.`;
  const upstream = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'content-type':'application/json',authorization:`Bearer ${process.env.OPENAI_API_KEY}`}, body:JSON.stringify({model:'gpt-4o-mini',stream:true,temperature:.2,messages:[{role:'system',content:system},...cleanMessages]}) });
  if (!upstream.ok || !upstream.body) return new Response('The model service is unavailable.', { status: 502 });
  return new Response(upstream.body, { headers: { 'content-type':'text/event-stream; charset=utf-8', 'cache-control':'no-cache' } });
}
