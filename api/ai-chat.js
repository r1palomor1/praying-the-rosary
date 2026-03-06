import { HfInference } from '@huggingface/inference';
import { checkRateLimit } from './utils/rateLimiter.js';
import { handleAPIError } from './utils/errorHandler.js';
import { logAIRequest } from './utils/logger.js';
import { MYSTERY_SYSTEM_PROMPT } from './utils/prompts.js';

const PRIMARY_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
const FALLBACK_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

export default async function handler(req, res) {
  // 1. Only allow POST requests for chat
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const endpoint = '/api/ai-chat';

  const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();

  // ENHANCED DIAGNOSTICS: Deep inspection of what vercel dev is injecting
  const allHuggingKeys = Object.keys(process.env).filter(k => k.toLowerCase().includes('hugging') || k.toLowerCase().includes('hf_'));
  console.log(`[Vercel Serverless] All HuggingFace-related env keys found:`, allHuggingKeys);
  console.log(`[Vercel Serverless] HUGGINGFACE_API_KEY present?`, !!apiKey);
  if (apiKey) {
    console.log(`[Vercel Serverless] Key length: ${apiKey.length}, first 6 chars: "${apiKey.substring(0, 6)}", charCode[0]: ${apiKey.charCodeAt(0)}`);
  }

  if (!apiKey || !apiKey.startsWith('hf_')) {
    console.error("[Vercel Serverless] KEY FAILURE: Found key starting with:", apiKey ? `"${apiKey.substring(0, 6)}"` : "undefined/empty");
    return res.status(500).json({ error: true, message: "Configuration Error", details: "API Key is missing or invalid on the backend at request time." });
  }

  const hf = new HfInference(apiKey);

  try {
    // 2. Rate Limit Check
    // Using IP as the "userId" identifier for anonymous rate limiting. Use safe chaining for Vercel environments.
    const ip = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit?.allowed) {
      logAIRequest(endpoint, false, Date.now() - startTime);
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    // 3. Parse and Validate Input securely (preventing TypeError on empty body)
    const { mysteryName = 'the Rosary', contextStr = '', language = 'en', userPrompt = '' } = req.body || {};

    // Build context
    const fullSystemPrompt = typeof MYSTERY_SYSTEM_PROMPT === 'string'
      ? MYSTERY_SYSTEM_PROMPT
      : "You are a Catholic guide explaining the Rosary.";

    // Strip HTML tags from context (raw USCCB/Vatican HTML)
    const cleanContext = contextStr ? contextStr.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim() : '';

    // Build dynamic context:
    // - If contextStr provided (e.g. Words of the Pope — no citable scripture), include the full text
    //   so the AI has the actual content to reflect on.
    // - If empty (scripture readings with citations), just reference by name and let the model
    //   use its own knowledge of the cited passage.
    let dynamicContext = cleanContext
      ? `The user is asking about: ${mysteryName}.\n\nThe text provided is:\n\n${cleanContext}\n\nRespond in ${language === 'es' ? 'Spanish' : 'English'}.`
      : `The user is asking about: ${mysteryName}.\nRespond in ${language === 'es' ? 'Spanish' : 'English'}.`;

    const messages = [
      { role: "system", content: `${fullSystemPrompt}\n\n${dynamicContext}` },
      { role: "user", content: userPrompt || "Please explain this mystery and its spiritual fruits." }
    ];

    // 4. API Call with Fallback Mechanism
    let responseText = "";
    try {
      // Try Primary (Llama 3.1)
      const out = await hf.chatCompletion({
        model: PRIMARY_MODEL,
        messages: messages,
        max_tokens: 300,
        temperature: 0.7
      });
      responseText = out?.choices?.[0]?.message?.content || "";
      if (!responseText) throw new Error("Empty response from primary model");
    } catch (primaryError) {
      console.warn("Primary HuggingFace Model failed. Retrying with Fallback...", primaryError.message);
      // Try Fallback (Mistral)
      const fallbackOut = await hf.chatCompletion({
        model: FALLBACK_MODEL,
        messages: messages,
        max_tokens: 300,
        temperature: 0.7
      });
      responseText = fallbackOut?.choices?.[0]?.message?.content || "I apologize, but I am unable to provide a reflection at this time.";
    }

    // 5. Success
    logAIRequest(endpoint, true, Date.now() - startTime);
    return res.status(200).json({ response: responseText });

  } catch (error) {
    const errorBody = handleAPIError(error);
    logAIRequest(endpoint, false, Date.now() - startTime);
    return res.status(500).json(errorBody);
  }
}
