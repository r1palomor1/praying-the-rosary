export interface BackupData {
    timestamp: string;
    version: string;
    deviceInfo?: string;
    data: {
        rosary_prayer_history?: any;
        sacred_prayer_history?: any;
        bible_completion_history?: any;
        bible_start_date?: string | null;
        bible_completed_days?: any;
        bible_completed_chapters?: any;
        settings?: any;
        [key: string]: any;
    };
}

export const EXCLUDED_KEYS = ['_progress_', 'rosary_prayer_progress', 'SYSTEM_PRE_IMPORT_BACKUP'];

export class BackupManager {
    static async exportData(): Promise<string> {
        const data: Record<string, any> = {};
        
        // Loop through localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            // Exclude temporary progress keys
            if (EXCLUDED_KEYS.some(excluded => key.includes(excluded))) {
                continue;
            }

            // Only export relevant tracking data
            if (
                key === 'rosary_prayer_history' ||
                key === 'sacred_prayer_history' ||
                key === 'bible_completion_history' ||
                key === 'bible_start_date' ||
                key === 'bible_completed_days' ||
                key === 'bible_completed_chapters' ||
                key === 'rosary_settings' ||
                key === 'rosary_language' ||
                key === 'rosary_last_completed' ||
                key.startsWith('dailyReadings_completed_')
            ) {
                try {
                    const value = localStorage.getItem(key);
                    if (value) {
                        data[key] = value.startsWith('{') || value.startsWith('[') 
                            ? JSON.parse(value) 
                            : value;
                    }
                } catch (e) {
                    console.error(`Error parsing key ${key} for export`, e);
                }
            }
        }

        const backup: BackupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            deviceInfo: navigator.userAgent,
            data
        };

        return JSON.stringify(backup, null, 2);
    }

    static downloadBackup(jsonString: string, filename: string = `holy_rosary_backup_${new Date().toISOString().split('T')[0]}.json`) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- IMPORT & MERGE ENGINE ---

    /**
     * Parse and validate an uploaded backup file
     */
    static async parseBackupFile(file: File): Promise<BackupData> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const result = e.target?.result as string;
                    const parsed = JSON.parse(result);
                    
                    if (!parsed.data || !parsed.version) {
                        throw new Error('Invalid backup file format');
                    }
                    resolve(parsed as BackupData);
                } catch (err) {
                    reject(new Error('Failed to parse backup file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Takes a snapshot of current data before applying an import (The "Glass Box")
     */
    static async createPreImportBackup(): Promise<void> {
        const currentData = await this.exportData();
        localStorage.setItem('SYSTEM_PRE_IMPORT_BACKUP', currentData);
    }

    /**
     * Checks if a pre-import backup exists
     */
    static hasPreImportBackup(): boolean {
        return !!localStorage.getItem('SYSTEM_PRE_IMPORT_BACKUP');
    }

    /**
     * Restores the snapshot taken before the last import (Panic Button)
     */
    static restorePreImportBackup(): boolean {
        const backupJson = localStorage.getItem('SYSTEM_PRE_IMPORT_BACKUP');
        if (!backupJson) return false;

        try {
            const backup = JSON.parse(backupJson) as BackupData;
            this.applyDataToStorage(backup.data);
            return true;
        } catch (e) {
            console.error("Failed to restore pre-import backup", e);
            return false;
        }
    }

    /**
     * Merge logic that applies a mathematical Set Union so no history elements are lost
     */
    static mergeHistories(localArray: any[], importedArray: any[]): any[] {
        if (!Array.isArray(localArray)) localArray = [];
        if (!Array.isArray(importedArray)) importedArray = [];

        const combined = [...localArray, ...importedArray];
        
        // Handle deduplication differently depending on if it's an array of strings or objects.
        // E.g., rosary history stores objects: { date: "2026-03-03", mysteryType: "glorious" }
        // A pure Set() will not deduplicate two identical objects, causing the "double up" bug.
        
        if (combined.length > 0 && typeof combined[0] === 'object' && combined[0] !== null) {
            // Deduplicate by stringified JSON representation to ensure deep uniqueness
            const uniqueMap = new Map();
            combined.forEach(item => {
                uniqueMap.set(JSON.stringify(item), item);
            });
            return Array.from(uniqueMap.values());
        }

        // Standard primitive deduplication
        const uniqueSet = new Set(combined);
        return Array.from(uniqueSet).sort();
    }

    /**
     * Specialized merge for Bible Chapters which are stored as Record<number, string[]>
     */
    static mergeBibleChapters(local: Record<number, string[]>, imported: Record<number, string[]>): Record<number, string[]> {
        const result: Record<number, string[]> = { ...local };
        
        if (imported && typeof imported === 'object') {
            for (const [day, chapters] of Object.entries(imported)) {
                const dayNum = Number(day);
                if (result[dayNum]) {
                    // Combine and deduplicate chapter arrays
                    const combined = [...result[dayNum], ...(Array.isArray(chapters) ? chapters : [])];
                    result[dayNum] = Array.from(new Set(combined));
                } else {
                    result[dayNum] = Array.isArray(chapters) ? chapters : [];
                }
            }
        }
        return result;
    }

    /**
     * Apply the data directly to localStorage based on user selections
     */
    static applyDataToStorage(dataToApply: Record<string, any>) {
        for (const [key, value] of Object.entries(dataToApply)) {
            if (typeof value === 'object' && value !== null) {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                localStorage.setItem(key, String(value));
            }
        }
    }
}

