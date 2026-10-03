import { buildSystemPrompt, PROFILES as profiles, LANGUAGES as languages, METRICS as metrics } from '../lib/chatPersona.js';
export const config = { runtime: 'edge' };
const model = process.env.VERCEL_ENV === 'production' ? (process.env.ANTHROPIC_PUBLIC_MODEL || 'claude-opus-4-6') : (process.env.ANTHROPIC_DEBUG_MODEL || process.env.ANTHROPIC_PUBLIC_MODEL || 'claude-opus-4-6');

export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!process.env.toy_model_key) return new Response('Chat is not configured.', { status: 503 });
  let body;
  try { body = await request.json(); } catch { return new Response('Invalid JSON.', { status: 400 }); }
  const { messages, spokenLang, userProfile, metricMode, isMatchMode = false } = body;
  if (!Array.isArray(messages) || !languages.has(spokenLang) || !profiles.has(userProfile) || !metrics.has(metricMode)) {
    return new Response('Invalid chat context.', { status: 400 });
  }
  const cleanMessages = messages.slice(-12)
    .filter(m => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

  const system = buildSystemPrompt({ spokenLang, userProfile, metricMode, isMatchMode });

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.toy_model_key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 32768, stream: true, temperature: 0.15, system, messages: cleanMessages }),
    });
    if (!upstream.ok || !upstream.body) return new Response('The model service is unavailable.', { status: 502 });
    return new Response(upstream.body, { headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache' } });
  } catch (error) {
    console.error('Anthropic gateway failure:', error);
    return new Response('The model service is unavailable.', { status: 502 });
  }
}
