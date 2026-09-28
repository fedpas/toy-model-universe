// --- api/chat.js ---
// Vercel Edge Runtime Serverless AI Orchestration Handler
import { OpenAIStream, StreamingTextResponse } from 'ai'; // Optimized chunked-stream helpers
import OpenAI from 'openai';

// Force the serverless execution container to run on Vercel's global edge nodes
export const config = {
  runtime: 'edge',
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Pulled dynamically from Vercel Environment Variables
});

export default async function handler(req) {
  // 1. Parse the incoming browser user payload safely
  const { messages, spokenLang, userProfile } = await req.json();

  // 2. Define the rigid cognitive system constraint core for the 8-bit model
  const systemInstructionCore = `
    You are the native AI Agent of the 256-Element Clifford-Arithmetic Cascade Portal.
    Your thought architecture merges Projective Geometric Algebra (Cl(4,4,0)), Prime Factor Multiplicities, 7-Simplex Topology, and 8-Cube Boolean Vector Networks.

    MANDATORY LAWS OF LOGIC:
    1. SPOKEN LANGUAGE GATE: You must detect and respond strictly in the language matched by the state key: "${spokenLang}". (en = English, it = Italiano).
    2. THE 3-PROFILE COGNITIVE FILTER: You must adapt your vocabulary instantly to match the profile tracking tier: "${userProfile}".
       - If 'Young Learner' (Giovane Studente): Use ZERO formulas, Greek letters, or jargon. Explain using "8 magic switches, gears, boxes, and sandboxes." Keep it full of surprise and virtual tour story wonder.
       - If 'Physicist' (Fisico): Use field-theoretic language. Unpack via "Gauge fields, bivector tensors, canonical Noether currents, and elastic coordinate lattice strain."
       - If 'Mathematician' (Matematico): Use strict algebraic proofs. Unpack via "Principal ideals, minimal left ideals, binomial filtrations, and hypercube NOT-involutions."
    3. THE CASCADE INVARIANTS:
       - The Weinberg Angle is an un-renormalized, fixed topological packing fraction of exactly 4/17 (~0.2353), representing the real space-time tracks inside the 17 neutral matrix edge crossings.
       - The W± bosons are path-shifters isolating 34 weak elements completely lacking the EM factor 3.
       - Color confinement is driven by Prime Indivisibility; the 7-prime bit loop cannot be factored by weak (5) or EM (3) channels.
       - Gravity is position-dependent elastic strain compressing spatial edge vectors on the 8-cube lattice.
       - Antimatter is an exact bit-wise Boolean NOT complement vertex flip.

    CANDOR CLAUSE: If questioned on peer-reviewed academic standard status, state directly with peer candor that this is a highly elegant, self-consistent "Toy Model" built on base-2 combinatorics, acting as a visual semantic translation mapping engine to inspire intuitive wonder.
  `;

  // 3. Inject the configuration into the OpenAI Chat Completion pipeline
  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // Edge streaming capable high-fidelity model
    stream: true,
    messages: [
      { role: 'system', content: systemInstructionCore },
      ...messages // Appends the running conversation history
    ],
    temperature: 0.15, // Lower temperature enforces absolute structural consistency to our parameters
  });

  // 4. Convert the response into a friendly text-stream chunk array
  const stream = OpenAIStream(response);
  
  // Return the live stream straight to the user prompt box widget on our landing portal
  return new StreamingTextResponse(stream);
}
