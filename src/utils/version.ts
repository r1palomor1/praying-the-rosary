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

export function formatDate(dateString: string, language: 'en' | 'es' = 'en'): string {
    const date = new Date(dateString);

    if (language === 'es') {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}
