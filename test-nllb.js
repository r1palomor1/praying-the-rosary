import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const MODEL = 'facebook/nllb-200-distilled-600M';

async function test() {
    console.log("Testing NLLB with API key:", process.env.HUGGINGFACE_API_KEY?.substring(0, 6) + "...");
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    try {
        const result = await hf.translation({
            model: MODEL,
            inputs: "Hello world",
            parameters: {
                src_lang: "eng_Latn",
                tgt_lang: "spa_Latn"
            }
        });
        console.log("Success:", result);
    } catch (e) {
        console.error("Error from hf.translation:", e.message);
    }

    try {
        const result = await hf.request({
            model: MODEL,
            inputs: "Hello world",
            parameters: {
                src_lang: "eng_Latn",
                tgt_lang: "spa_Latn"
            }
        });
        console.log("Success via request:", result);
    } catch (e) {
        console.error("Error from hf.request:", e.message);
    }
}
test();
