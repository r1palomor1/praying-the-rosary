import { HfInference } from '@huggingface/inference';

// Helsinki-NLP translation models — free, no generative tokens consumed
// Extremely reliable on HuggingFace free inference tier!
const MODELS = {
    'en-es': 'Helsinki-NLP/opus-mt-en-es',
    'es-en': 'Helsinki-NLP/opus-mt-es-en',
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = (process.env.HUGGINGFACE_API_KEY || process.env.HUGGING_FACE_API_KEY)?.trim();
    if (!apiKey || !apiKey.startsWith('hf_')) {
        return res.status(500).json({ error: 'Translation service not configured.' });
    }

    const { text, texts, from, to } = req.body || {};
    const inputsToTranslate = texts || (text ? [text] : []);
    if (inputsToTranslate.length === 0 || !from || !to) {
        return res.status(400).json({ error: 'Missing required fields: text(s), from, to' });
    }

    const modelKey = `${from}-${to}`;
    const model = MODELS[modelKey];
    if (!model) {
        return res.status(400).json({ error: `Unsupported translation pair: ${modelKey}` });
    }

    try {
        const hf = new HfInference(apiKey);
        const translatedOutputs = [];

        for (const input of inputsToTranslate) {
            if (!input) {
                translatedOutputs.push('');
                continue;
            }
            // Helsinki models use the translation_en_to_es task format
            // We split by sentence to handle long reflections gracefully
            const sentences = input.match(/[^.!?]+[.!?]*|[^.!?]+$/g) || [input];
            const translatedParts = [];

            for (const sentence of sentences) {
                const trimmed = sentence.trim();
                if (!trimmed) continue;
                const result = await hf.translation({
                    model,
                    inputs: trimmed,
                });
                // HF translation returns { translation_text: '...' }
                const translated = result?.translation_text || trimmed;
                translatedParts.push(translated);
            }
            translatedOutputs.push(translatedParts.join(' '));
        }

        if (texts) {
            return res.status(200).json({ translated: translatedOutputs });
        } else {
            return res.status(200).json({ translated: translatedOutputs[0] });
        }

    } catch (err) {
        console.error('[translate.js] Helsinki-NLP error:', err?.message || err);
        return res.status(500).json({ error: 'Translation failed. Please try again.' });
    }
}
