import { HfInference } from '@huggingface/inference';
import { checkRateLimit } from './utils/rateLimiter.js';
import { handleAPIError } from './utils/errorHandler.js';
import { logAIRequest } from './utils/logger.js';

const PRIMARY_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
const FALLBACK_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

const DURATION_TOKENS = {
  short: 600,     // Was 450
  medium: 1200,   // Was 750
  long: 2500,     // Was 1200
};

const TONE_DESCRIPTORS = {
  pastoral:      'warm, approachable, and shepherd-like — speak as a father to his flock',
  teaching:      'instructive and clear — guide the faithful through doctrine with precision and warmth',
  contemplative: 'quiet, reflective, and interior — invite the soul into silence and encounter',
  urgent:        'prophetic and direct — call the faithful to wake up, examine their hearts, and return to God without delay',
};

function buildSystemPrompt(mode, tone, duration, language) {
  const toneDesc = TONE_DESCRIPTORS[tone] || TONE_DESCRIPTORS.pastoral;
  const isSpanish = language === 'es';

  const langInstruction = isSpanish
    ? 'Write the entire sermon in Spanish, using warm and natural spoken Spanish appropriate for a Catholic parish.'
    : 'Write the entire sermon in English.';

  const durationDesc =
    duration === 'short'
      ? 'approximately 200–280 words (1 to 2 minutes spoken). You MUST write at least 200 words before concluding.'
      : duration === 'long'
      ? 'approximately 750–950 words (5 or more minutes spoken). You MUST write at least 700 words before concluding.'
      : 'approximately 420–560 words (3 to 4 minutes spoken). You MUST write at least 400 words before concluding.';

  const preparationProtocol = `\
You are a learned Catholic homilist, theologian, and spiritual director preparing a sermon or homily.

Before writing, approach this task with the mindset of a Catholic priest preparing for Mass:

1. ROMAN CALENDAR MINDSET: You are aware of the liturgical season, feast days, solemnities, and memorials. If the input references a specific date or feast, honor its liturgical significance. If not, treat the scripture on its own theological terms.

2. LECTIONARY MINDSET: Scripture readings assigned for the Mass are not random — they are chosen by the Church to speak to the faithful at a particular moment in the liturgical year. Treat the input as the "assigned reading" and preach from that sacred context.

3. CATECHISM ANCHOR: Your theological content is grounded in the Catechism of the Catholic Church. You do not speculate beyond authentic Catholic teaching. When you make doctrinal claims, they reflect the Magisterium.

4. PATRISTIC AND THEOLOGICAL DEPTH: Draw on the wisdom of the Church Fathers (Augustine, Aquinas, Chrysostom, Bernard of Clairvaux) in your tone and depth, even when not citing them by name. Preach with 2,000 years of Catholic tradition behind your voice.

5. FLEXIBLE INPUT: The scripture or theme provided may be in any format — a book name ("Luke"), a chapter ("Luke 5"), specific verses ("Luke 5:5-10"), a feast name ("Feast of the Ascension"), a doctrinal theme ("mercy"), or a pastoral phrase ("a sermon on forgiveness"). Interpret all inputs charitably and faithfully as a Catholic theological reference.

6. OUTPUT FORMAT: Do NOT include section headers, numbered labels, or markdown formatting (no **bold**, no *italic*, no # headings) in the output. Write as flowing, spoken prose only — as a priest would actually deliver it at the ambo. The output should read as natural speech, not a formatted document. Do NOT output labels like "LITURGICAL GREETING" or "PASTORAL APPLICATION".

${langInstruction}
Target length: ${durationDesc}.
Tone: ${toneDesc}.
Use "we" and "us" language throughout — the homilist stands with the congregation, not above them.
End every sermon with "Amen."`;

  const standardStructure = `\

SERMON MODE: STANDARD HOMILY
Follow this structure exactly:
1. LITURGICAL GREETING & CONTEXT: Begin with "Brothers and sisters," and briefly acknowledge the liturgical moment or feast if relevant.
2. SCRIPTURE PROCLAMATION: Announce and center the reading or theme. Let the Word speak first.
3. DOCTRINAL REFLECTION: Unpack the theological meaning through the lens of the Catechism and Catholic tradition.
4. PASTORAL APPLICATION: Bring the truth home. How does this reading change how we pray, forgive, love, suffer, or serve this week? Be concrete.
5. CLOSING SEND-FORTH: A strong, memorable closing that sends the faithful out changed. End with "Amen."`;

  const abstractStructure = `\

SERMON MODE: ABSTRACT CONTEMPLATIVE REFLECTION
Follow this structure exactly:
1. OPENING IMAGE OR PARADOX: Begin not with greeting but with an arresting image, paradox, or mystery drawn from the text.
2. THE MYSTERY BENEATH THE TEXT: Descend beneath the surface meaning. What is God doing in this passage that is not immediately obvious?
3. INTERIOR MOVEMENT OF GRACE: How does grace move in the soul through this word? Speak to memory, desire, fear, and longing.
4. CONTEMPLATIVE INVITATION: Do not give answers — give an invitation to remain, listen, and yield. The soul is changed in silence, not noise.
5. CLOSING WITH REVERENT MYSTERY: End not with resolution but with wonder. Leave the listener in God's presence. End with "Amen."`;

  return preparationProtocol + (mode === 'abstract' ? abstractStructure : standardStructure);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const endpoint = '/api/sermon';

  const apiKey = (process.env.HUGGINGFACE_API_KEY || process.env.HUGGING_FACE_API_KEY)?.trim();
  if (!apiKey || !apiKey.startsWith('hf_')) {
    return res.status(500).json({
      error: true,
      message: 'Configuration Error',
      details: 'API Key is missing or invalid.',
    });
  }

  const hf = new HfInference(apiKey);

  try {
    const ip = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit?.allowed) {
      logAIRequest(endpoint, false, Date.now() - startTime);
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    const {
      sourceText = '',
      mode     = 'standard',
      tone     = 'pastoral',
      duration = 'medium',
      language = 'en',
    } = req.body || {};

    if (!sourceText.trim()) {
      return res.status(400).json({ error: 'No source text provided.' });
    }

    const systemPrompt = buildSystemPrompt(mode, tone, duration, language);
    const maxTokens   = DURATION_TOKENS[duration] || DURATION_TOKENS.medium;
    const temperature = mode === 'abstract' ? 0.85 : 0.70;

    const userMessage = `Please prepare a ${mode === 'abstract' ? 'contemplative abstract reflection' : 'standard Catholic homily'} based on: "${sourceText}"`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  },
    ];

    let responseText = '';
    try {
      const out = await hf.chatCompletion({ model: PRIMARY_MODEL, messages, max_tokens: maxTokens, temperature });
      responseText = out?.choices?.[0]?.message?.content || '';
      if (!responseText) throw new Error('Empty response from primary model');
    } catch (primaryError) {
      console.warn('[Sermon] Primary model failed, trying fallback:', primaryError.message);
      const fallbackOut = await hf.chatCompletion({ model: FALLBACK_MODEL, messages, max_tokens: maxTokens, temperature });
      responseText = fallbackOut?.choices?.[0]?.message?.content || 'Unable to generate sermon at this time.';
    }

    logAIRequest(endpoint, true, Date.now() - startTime);
    return res.status(200).json({ response: responseText });

  } catch (error) {
    const errorBody = handleAPIError(error);
    logAIRequest(endpoint, false, Date.now() - startTime);
    return res.status(500).json(errorBody);
  }
}
