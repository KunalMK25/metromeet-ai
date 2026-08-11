// Real Claude integration: the structured context is passed as system
// context so the model grounds any app-related answer in the same
// data contextAwareAnswer() uses, while still answering general
// questions (Bangalore, metro history, etc.) from its own knowledge.
// This uses the same api.anthropic.com/v1/messages call available to
// Claude-built artifacts — no key required in that environment.
/**
 * AI module — live Claude fallback for anything the direct-answer
 * layer couldn't handle.
 * @summary Purpose: forward the user's message to the real Claude API
 *   with the app-state context attached as system context, so
 *   app-related follow-ups stay grounded in real data while general
 *   questions (Bangalore facts, metro history, etc.) still get
 *   answered from the model's own knowledge.
 * @param {string} userMsg - the raw user message
 * @param {Object} ctx - a buildAppContext() snapshot
 * @returns {Promise<string>} the model's reply text
 * @throws if the HTTP request fails or the response has no text —
 *   the caller (sendMsg) catches this and falls back to offlineBotReply.
 * @complexity Network-bound.
 * @sideEffects Performs a network fetch() to api.anthropic.com.
 */
export async function askClaudeWithContext(userMsg, ctx){
  const systemPrompt = `You are MetroBot, the assistant embedded in MetroMeet AI (a Bangalore Namma Metro meetup planner). `
    + `When the question is about the user's friends, routes, meetup station, fares, interchanges, or nearby places, `
    + `answer ONLY using the "Current application state" JSON below — never invent numbers or stations that aren't in it. `
    + `If something isn't in the data (e.g. no meetup computed yet), say so and suggest adding friends / clicking "Find Best Meet Point". `
    + `For general questions outside this app's data (Bangalore facts, metro history, etc.), answer normally from your own knowledge. `
    + `Keep replies short and use the same **bold**/emoji style as the rest of the app.\n\n`
    + `Current application state:\n${JSON.stringify(ctx)}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API request failed (${res.status})`);
  const data = await res.json();
  const text = (data.content||[]).map(b=>b.text||'').join('\n').trim();
  if (!text) throw new Error('Empty response from Claude API');
  return text;
}
