/**
 * Sanitizes text for speech synthesis by removing or replacing characters
 * that may cause the TTS engine to pronounce unwanted sounds
 */
export function sanitizeTextForSpeech(text: string): string {
    return text
        // Remove inverted Spanish punctuation marks (¡ and ¿)
        .replace(/¡/g, '')
        .replace(/¿/g, '')
        // Remove other special characters that might be mispronounced
        .replace(/[«»]/g, '"')  // Replace guillemets with regular quotes
        .replace(/[""]/g, '"')  // Normalize smart quotes
        .replace(/['']/g, "'")  // Normalize smart apostrophes
        // Keep regular punctuation (. , ; : ! ? - etc.) as they help with prosody
        .trim();
}
