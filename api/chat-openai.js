export const config = { runtime: 'edge' };
import { buildSystemPrompt, PROFILES as profiles, LANGUAGES as languages, METRICS as metrics } from '../lib/chatPersona.js';

export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!process.env.ToyModelKeyOpenAi) return new Response('Chat is not configured.', { status: 503 });
  let body;
  try { body=await request.json(); } catch { return new Response('Invalid JSON.', {status:400}); }
  const {messages,spokenLang,userProfile,metricMode,isMatchMode=false}=body;
  if (!Array.isArray(messages)||!languages.has(spokenLang)||!profiles.has(userProfile)||!metrics.has(metricMode)) return new Response('Invalid chat context.', {status:400});
  const cleanMessages=messages.slice(-12).filter(m=>['user','assistant'].includes(m?.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,4000)}));
  const system=buildSystemPrompt({spokenLang,userProfile,metricMode,isMatchMode});
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('data: {"type":"status","message":"OpenAI o3 is reasoning…"}\n\n'));
      try {
        const upstream=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${process.env.ToyModelKeyOpenAi}`},body:JSON.stringify({model:'o3',stream:true,max_completion_tokens:32768,messages:[{role:'system',content:system},...cleanMessages]})});
        if(!upstream.ok||!upstream.body) {
          const detail=(await upstream.text()).slice(0,500);
          console.error('OpenAI upstream error',upstream.status,detail);
          controller.enqueue(encoder.encode('data: {"type":"error","message":"The OpenAI model service is unavailable."}\n\n'));
          return;
        }
        const reader=upstream.body.getReader();
        while(true) { const {value,done}=await reader.read(); if(done) break; controller.enqueue(value); }
      } catch(error) {
        console.error('OpenAI gateway failure:',error);
        controller.enqueue(encoder.encode('data: {"type":"error","message":"The OpenAI model service is unavailable."}\n\n'));
      } finally { controller.close(); }
    }
  });
  return new Response(stream,{headers:{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache, no-transform','connection':'keep-alive'}});
}
