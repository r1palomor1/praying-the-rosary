import { HfInference } from '@huggingface/inference';
import { checkRateLimit } from './utils/rateLimiter.js';
import { handleAPIError } from './utils/errorHandler.js';
import { logAIRequest } from './utils/logger.js';
import { MYSTERY_SYSTEM_PROMPT } from './utils/prompts.js';

const PRIMARY_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
const FALLBACK_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export default async function handler(req, res) {
  // 1. Only allow POST requests for chat
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const endpoint = '/api/ai-chat';

  try {
    // 2. Rate Limit Check
    // Using IP as the "userId" identifier for anonymous rate limiting
    const ip = (req.headers && req.headers['x-forwarded-for']) || (req.socket && req.socket.remoteAddress) || 'unknown';
    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.allowed) {
      logAIRequest(endpoint, false, Date.now() - startTime);
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    // 3. Parse and Validate Input
    const { mysteryName, contextStr, language = 'en', userPrompt } = req.body;
    
    // Build context
    const fullSystemPrompt = typeof MYSTERY_SYSTEM_PROMPT === 'string' 
      ? MYSTERY_SYSTEM_PROMPT 
      : "You are a Catholic guide explaining the Rosary.";

    let dynamicContext = `You are explaining the \${mysteryName} mystery of the Rosary.
Context: \${contextStr}
Language: \${language === 'es' ? 'Spanish' : 'English'}`;

    const messages = [
      { role: "system", content: `\${fullSystemPrompt}\n\n\${dynamicContext}` },
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
      responseText = out.choices[0].message.content;
    } catch (primaryError) {
      console.warn("Primary HuggingFace Model failed. Retrying with Fallback...");
      // Try Fallback (Mistral)
      const fallbackOut = await hf.chatCompletion({
        model: FALLBACK_MODEL,
        messages: messages,
        max_tokens: 300,
        temperature: 0.7
      });
      responseText = fallbackOut.choices[0].message.content;
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
