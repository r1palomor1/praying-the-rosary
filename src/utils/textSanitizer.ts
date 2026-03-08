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
        .replace(/[«»]/g, '')  // Strip guillemets completely to avoid TTS pronouncing them
        .replace(/["“”]/g, '')  // Completely remove straight and smart double quotes
        .replace(/['‘’]/g, "'")  // Normalize smart apostrophes to straight apostrophes
        // Prevent ellipsis or multiple dots being read aloud as "punto punto"
        .replace(/\.{2,}/g, '.')
        // Keep regular punctuation (. , ; : ! ? - etc.) as they help with prosody
        .trim();
}

/**
 * Additional sanitization for AI-generated response text before TTS playback.
 * Strips markdown formatting characters the TTS engine reads aloud awkwardly.
 * Only strips content inside (), [], {} brackets for citations.
 * Bare inline scripture refs like "Luke 16:19-31" are preserved.
 */
export function sanitizeAIResponseForSpeech(text: string): string {
    return sanitizeTextForSpeech(
        text
            // ── Bracket citations (CCC refs, footnotes, etc.) ──────────────
            .replace(/\([^)]*\)/g, '')           // (CCC 1033), (John 3:16)
            .replace(/\[[^\]]*\]/g, '')           // [1], [note]
            .replace(/\{[^}]*\}/g, '')            // {footnote}

            // ── Markdown bold/italic (order matters: ** before *) ──────────
            .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // ***bold italic***
            .replace(/\*\*(.+?)\*\*/g, '$1')     // **bold**
            .replace(/\*(.+?)\*/g, '$1')         // *italic*
            .replace(/__(.+?)__/g, '$1')         // __bold__
            .replace(/_(.+?)_/g, '$1')           // _italic_

            // ── Markdown headers (# ## ###) ───────────────────────────────
            .replace(/^#{1,6}\s*/gm, '')

            // ── Bullet list markers ───────────────────────────────────────
            .replace(/^\s*[-•]\s+/gm, '')        // - item or • item
            .replace(/^\s*\d+\.\s+/gm, '')       // 1. item (numbered lists)

            // ── Inline code backticks ─────────────────────────────────────
            .replace(/`([^`]*)`/g, '$1')         // `code` → code

            // ── Smart / curly quotes / strict punctuation strips ──────────
            .replace(/["“”]/g, '')               // remove double quotes entirely
            .replace(/['‘’]/g, "'")              // normalize single quotes
            .replace(/\.{2,}/g, '.')             // collapse multiple periods

            // ── Dashes: em/en dash → brief spoken pause (comma) ──────────
            .replace(/\s*[—–]\s*/g, ', ')

            // ── Colons after bold label e.g. "Prayer:" already stripped ──
            // (labels like "Prayer:" "Note:" are fine — TTS reads them well)

            // ── Horizontal rules ──────────────────────────────────────────
            .replace(/^[-*_]{3,}\s*$/gm, '')

            // ── Collapse multiple spaces/newlines left behind ─────────────
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim()
    );
}

/**
 * Normalizes citation strings based on the language.
 * Spanish Bibles traditionally use commas for chapters and periods for verses.
 * English Bibles use colons for chapters and commas for verses.
 * This unifies both into the English formatting for aesthetic consistency.
 */
export function formatCitation(citation: string | null | undefined, language: string): string {
    if (!citation) {
        return language === 'es' ? 'Lectura' : 'Reading';
    }

    if (language === 'es') {
        return citation
            .replace(/(\d+),\s*(\d)/g, '$1:$2')
            .replace(/\s*-\s*/g, '-')
            .replace(/\.\s*/g, ', ');
    }

    return citation.replace(/\s*-\s*/g, '-');
}
