export interface VersionInfo {
    hash: string;
    date: string;
    message: string;
    timestamp: string;
    environment: 'production' | 'development';
}

let cachedVersion: VersionInfo | null = null;

export async function getVersionInfo(): Promise<VersionInfo> {
    if (cachedVersion) {
        return cachedVersion;
    }

    try {
        const response = await fetch('/version.json');
        if (!response.ok) {
            throw new Error('Version file not found');
        }
        cachedVersion = await response.json() as VersionInfo;
        return cachedVersion;
    } catch (error) {
        // Fallback for local development
        const fallback: VersionInfo = {
            hash: 'dev',
            date: new Date().toISOString().split('T')[0],
            message: 'Local Development',
            timestamp: new Date().toISOString(),
            environment: 'development'
        };
        cachedVersion = fallback;
        return fallback;
    }
}

export function formatDate(dateString: string): string {
    // Avoid timezone issues by splitting the YYYY-MM-DD string directly
    // new Date("YYYY-MM-DD") parses as UTC, which shifts to previous day in Western timezones
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        return `${month}/${day}/${year}`;
    }

    // Fallback for other formats
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
}

/**
 * Format date with time (e.g., "Feb 01, 2026, 2:24 PM")
 */
export function formatDateTime(isoString: string, language: 'en' | 'es' = 'en'): string {
    const date = new Date(isoString);

    // Date part: MMM DD, YYYY (same format for both languages)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const datePart = `${month} ${day}, ${year}`;

    // Time part: h:mm AM/PM
    const timePart = date.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return `${datePart}, ${timePart}`;
}
