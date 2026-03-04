import { useState, useRef } from 'react';
import { Upload, X, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import { BackupManager, type BackupData } from '../../utils/backupManager';
import './ImportBackupModal.css';

interface ImportBackupModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: 'en' | 'es';
    onImportSuccess: () => void;
}

export function ImportBackupModal({ isOpen, onClose, language, onImportSuccess }: ImportBackupModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<'upload' | 'configure' | 'conflict' | 'bible-conflict' | 'success'>('upload');
    const [parsedData, setParsedData] = useState<BackupData | null>(null);
    const [error, setError] = useState<string>('');
    const [bibleStats, setBibleStats] = useState<{localStart: string, localCount: number, importedStart: string, importedCount: number} | null>(null);

    // Selections
    const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
    const [selectRosary, setSelectRosary] = useState(true);
    const [selectSacred, setSelectSacred] = useState(true);
    const [selectBible, setSelectBible] = useState(true);
    const [selectSettings, setSelectSettings] = useState(true);

    const t = {
        title: language === 'es' ? 'Importar Datos' : 'Import Backup Data',
        selectFile: language === 'es' ? 'Seleccionar Archivo .json' : 'Select .json file',
        uploadDesc: language === 'es' ? 'Sube tu archivo de respaldo de Holy Rosary.' : 'Upload your Holy Rosary backup file.',
        configure: language === 'es' ? 'Configurar Importación' : 'Configure Import',
        selectVols: language === 'es' ? '¿Qué módulos quieres importar?' : 'Which modules do you want to import?',
        mode: language === 'es' ? 'Modo de Importación' : 'Import Mode',
        merge: language === 'es' ? 'Combinar (Recomendado)' : 'Merge Histories (Recommended)',
        mergeDesc: language === 'es' ? 'Mantiene los datos de tu dispositivo actual y añade los del respaldo sin perder fechas.' : 'Keeps your current device data and safely adds the backup data without losing dates.',
        replace: language === 'es' ? 'Reemplazar Completamente' : 'Replace Completely',
        replaceDesc: language === 'es' ? 'Borra los datos del dispositivo seleccionado y usa SOLO lo que está en el archivo.' : 'Wipes selected device data and uses ONLY what is in the file.',
        runImport: language === 'es' ? 'Ejecutar Importación' : 'Run Import',
        success: language === 'es' ? '¡Importación Exitosa!' : 'Import Successful!',
        undo: language === 'es' ? 'Deshacer Última Importación' : 'Undo Last Import',
        undoSuccess: language === 'es' ? 'Importación Deshecha' : 'Import Undone',
        close: language === 'es' ? 'Cerrar' : 'Close',
        rosary: language === 'es' ? 'Historial del Rosario' : 'Rosary History',
        sacred: language === 'es' ? 'Oraciones Sagradas' : 'Sacred Prayers',
        bible: language === 'es' ? 'Biblia en un Año' : 'Bible in a Year',
        settings: language === 'es' ? 'Configuración de la App' : 'App Settings',
        conflictTitle: language === 'es' ? '¡Advertencia de Conflicto de Datos!' : 'Data Conflict Warning!',
        conflictDesc: language === 'es' ? 'Su dispositivo local contiene un historial único que no está en este archivo de copia de seguridad. Si elige Reemplazar, perderá estos datos. ¿Borrar de todos modos o Combinar en su lugar?' : 'Your local device contains unique history not in this file. If you Replace, you will lose this local data. Erase anyway, or Merge instead?',
        eraseAnyway: language === 'es' ? 'Borrar y Reemplazar' : 'Erase & Replace',
        switchMerge: language === 'es' ? 'Cambiar a Combinar' : 'Switch to Merge',
        bibleConflictTitle: language === 'es' ? 'Desajuste del Viaje Bíblico' : 'Bible Journey Mismatch',
        bibleConflictDesc: language === 'es' 
            ? 'No podemos combinar tus viajes bíblicos activos porque comenzaron en fechas diferentes. Por favor, elige qué viaje mantener en este dispositivo:' 
            : 'We cannot combine your active Bible journeys because they began on different dates. Please choose which journey to keep for this device:',
        keepDeviceData: language === 'es' ? 'Mantener Progreso del Dispositivo' : 'Keep Device Progress',
        useBackupData: language === 'es' ? 'Usar Copia en su Lugar' : 'Use Backup Instead',
        startedOn: language === 'es' ? 'Iniciado' : 'Started',
        daysCompleted: language === 'es' ? 'días completos' : 'days complete',
    };

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr || !dateStr.includes('-')) return dateStr;
        const [y, m, d] = dateStr.split('-');
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        try {
            const data = await BackupManager.parseBackupFile(file);
            setParsedData(data);
            setStep('configure');
        } catch (err: any) {
            setError(err.message || 'Error parsing file');
        }
    };

    const executeImport = async (forceReplace: boolean = false, overrideBible: 'device' | 'backup' | 'merge' | null = null) => {
        try {
            if (!parsedData) return;

            // SMART BIBLE MERGE CHECK
            let bibleAction = overrideBible;
            if (selectBible && importMode === 'merge' && bibleAction === null) {
                const localStart = localStorage.getItem('bible_start_date');
                const importedStart = parsedData.data['bible_start_date'];
                
                // Only conflict if BOTH exist and are DIFFERENT
                if (localStart && importedStart && localStart !== importedStart) {
                    let localCount = 0;
                    let importedCount = 0;
                    try { localCount = JSON.parse(localStorage.getItem('bible_completed_days') || '[]').length; } catch(e){}
                    try { importedCount = (parsedData.data['bible_completed_days'] || []).length; } catch(e){}
                    
                    setBibleStats({ localStart, localCount, importedStart, importedCount });
                    setStep('bible-conflict');
                    return; // halt and wait for user explicitly
                } else if (!localStart || !importedStart || localStart === importedStart) {
                    // Safe to merge
                    bibleAction = 'merge';
                }
            } else if (selectBible && importMode === 'replace') {
                bibleAction = 'backup'; // Standard replace
            }

            // Optional: check for smart conflicts before proceeding if in replace mode
            if (!forceReplace) {
                let hasConflict = false;

                const checkConflict = (isSelected: boolean, keys: string[], isMergeable: boolean) => {
                    if (!isSelected) return;
                    
                    // If we are in merge mode and the field supports merging, there's no data loss conflict here.
                    if (importMode === 'merge' && isMergeable) return;

                    for (const key of keys) {
                        const local = localStorage.getItem(key);
                        if (!local) continue;

                        try {
                            const localArr = JSON.parse(local);
                            const importedArr = parsedData.data[key] || [];

                            if (Array.isArray(localArr) && Array.isArray(importedArr)) {
                                // Check if local has items NOT in imported
                                const importedStrSet = new Set(importedArr.map(item => 
                                    typeof item === 'object' ? JSON.stringify(item) : String(item)
                                ));

                                for (const item of localArr) {
                                    const strItem = typeof item === 'object' ? JSON.stringify(item) : String(item);
                                    if (!importedStrSet.has(strItem)) {
                                        hasConflict = true;
                                        break;
                                    }
                                }
                            }
                        } catch (e) {
                            // ignore parse errors for simple strings
                        }
                    }
                };

                checkConflict(selectRosary, ['rosary_prayer_history'], true);
                checkConflict(selectSacred, ['sacred_prayer_history'], true);
                checkConflict(selectBible, ['bible_completion_history'], true);
                // Active Bible tracking cannot merge due to start_date sync issues. So we check it even in 'merge' mode.
                checkConflict(selectBible, ['bible_completed_days'], false); 

                if (hasConflict) {
                    setStep('conflict');
                    return; // Stop the flow, wait for user decision
                }
            }

            // 1. Take safety snapshot
            await BackupManager.createPreImportBackup();

            // 2. Build final data object based on permissions
            const dataToApply: Record<string, any> = {};

            const processModule = (
                isSelected: boolean, 
                keys: string[], 
                isHistory: boolean = true
            ) => {
                if (!isSelected) return;

                keys.forEach(key => {
                    if (parsedData.data[key] !== undefined) {
                        if (isHistory && importMode === 'merge') {
                            // MERGE Mode
                            const local = localStorage.getItem(key);
                            // Protect against trying to JSON.parse simple strings
                            let localArr = [];
                            try {
                                localArr = local ? JSON.parse(local) : [];
                            } catch (e) {
                                // Fallback for bad data or single items
                            }
                            const importedArr = parsedData.data[key];
                            dataToApply[key] = BackupManager.mergeHistories(localArr, importedArr);
                        } else {
                            // REPLACE Mode (or not a history array, e.g. Settings)
                            dataToApply[key] = parsedData.data[key];
                        }
                    }
                });
            };

            // Process sections
            processModule(selectRosary, ['rosary_prayer_history'], true);
            processModule(selectRosary, ['rosary_last_completed', 'rosary_start_date'], false); // Not an array!

            processModule(selectSacred, ['sacred_prayer_history'], true);
            processModule(selectSacred, ['sacred_start_date'], false);

            // Dynamically import Daily Readings if user imports general prayer data
            if (selectRosary || selectSacred) {
                Object.keys(parsedData.data).forEach(k => {
                    if (k.startsWith('dailyReadings_completed_')) {
                        processModule(true, [k], true); // Merge the string arrays
                    }
                });
            }

            // Bible handling
            if (selectBible) {
                // Completed Historic Vault always merges in merge mode, or replaces in replace mode
                processModule(true, ['bible_completion_history'], true);
                
                if (bibleAction === 'merge') {
                    // Safe active merge (start dates matched or one was empty)
                    if (parsedData.data['bible_start_date'] !== undefined) {
                        dataToApply['bible_start_date'] = parsedData.data['bible_start_date'];
                    }
                    
                    let localDays = [];
                    try { localDays = JSON.parse(localStorage.getItem('bible_completed_days') || '[]'); } catch(e){}
                    dataToApply['bible_completed_days'] = BackupManager.mergeHistories(localDays, parsedData.data['bible_completed_days'] || []);
                    
                    let localChapters = {};
                    try { localChapters = JSON.parse(localStorage.getItem('bible_completed_chapters') || '{}'); } catch(e){}
                    dataToApply['bible_completed_chapters'] = BackupManager.mergeBibleChapters(localChapters, parsedData.data['bible_completed_chapters'] || {});
                    
                } else if (bibleAction === 'backup') {
                    // Force complete overwrite (Replace mode, or user chose "Overwrite with Backup")
                    ['bible_start_date', 'bible_completed_days', 'bible_completed_chapters'].forEach(k => {
                        if (parsedData.data[k] !== undefined) dataToApply[k] = parsedData.data[k];
                    });
                } else if (bibleAction === 'device') {
                    // Do nothing for active keys, honoring "Keep Device Data"
                }
            }

            // Handle read-only logic settings
            if (selectSettings) {
                const settingKeys = ['rosary_settings', 'rosary_language', 'announce_fruit_in_decades'];
                settingKeys.forEach(key => {
                    if (parsedData.data[key] !== undefined) dataToApply[key] = parsedData.data[key];
                });
            }

            // 3. Apply to localStorage
            BackupManager.applyDataToStorage(dataToApply);

            // 4. Conclude
            setStep('success');
            onImportSuccess();
        } catch (e: any) {
            console.error("Import failed:", e);
            setError("Import failed: " + (e.message || "Unknown error"));
        }
    };

    const handleUndo = () => {
        if (BackupManager.restorePreImportBackup()) {
            alert(t.undoSuccess);
            onImportSuccess();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="import-modal-overlay">
            <div className="import-modal">
                <header className="import-modal-header">
                    <h2>{t.title}</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </header>

                <div className="import-modal-body">
                    {/* Error display */}
                    {error && (
                        <div className="import-error">
                            <AlertTriangle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="import-step-upload">
                            <Upload size={48} className="upload-icon" />
                            <p>{t.uploadDesc}</p>
                            <input 
                                type="file" 
                                accept=".json" 
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                            <button className="import-btn-primary" onClick={() => fileInputRef.current?.click()}>
                                {t.selectFile}
                            </button>

                            {BackupManager.hasPreImportBackup() && (
                                <button className="import-btn-secondary" onClick={handleUndo} style={{ marginTop: '24px' }}>
                                    <History size={16} style={{marginRight: '8px'}}/>
                                    {t.undo}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Step 2: Configure */}
                    {step === 'configure' && parsedData && (
                        <div className="import-step-configure">
                            <h3>{t.configure}</h3>
                            
                            <div className="config-section">
                                <h4>{t.selectVols}</h4>
                                <label className="check-label">
                                    <input type="checkbox" checked={selectRosary} onChange={(e) => setSelectRosary(e.target.checked)} />
                                    {t.rosary}
                                </label>
                                <label className="check-label">
                                    <input type="checkbox" checked={selectSacred} onChange={(e) => setSelectSacred(e.target.checked)} />
                                    {t.sacred}
                                </label>
                                <label className="check-label">
                                    <input type="checkbox" checked={selectBible} onChange={(e) => setSelectBible(e.target.checked)} />
                                    {t.bible}
                                </label>
                                <label className="check-label">
                                    <input type="checkbox" checked={selectSettings} onChange={(e) => setSelectSettings(e.target.checked)} />
                                    {t.settings}
                                </label>
                            </div>

                            <div className="config-section">
                                <h4>{t.mode}</h4>
                                <div 
                                    className={`radio-card ${importMode === 'merge' ? 'active' : ''}`}
                                    onClick={() => setImportMode('merge')}
                                >
                                    <strong>{t.merge}</strong>
                                    <p>{t.mergeDesc}</p>
                                </div>
                                <div 
                                    className={`radio-card replace ${importMode === 'replace' ? 'active' : ''}`}
                                    onClick={() => setImportMode('replace')}
                                >
                                    <strong>{t.replace}</strong>
                                    <p>{t.replaceDesc}</p>
                                </div>
                            </div>

                            <div className="import-modal-footer">
                                <button className="import-btn-primary" onClick={() => executeImport(false)}>
                                    {t.runImport}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2.5: Conflict Warning */}
                    {step === 'conflict' && (
                        <div className="import-step-conflict" style={{ textAlign: 'center', padding: '24px 0' }}>
                            <AlertTriangle size={64} style={{ color: '#ef4444', marginBottom: '16px' }} />
                            <h3 style={{ color: '#ef4444', marginTop: 0 }}>{t.conflictTitle}</h3>
                            <p style={{ lineHeight: 1.5, marginBottom: '24px' }}>{t.conflictDesc}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {importMode === 'replace' && (
                                    <button 
                                        className="import-btn-primary" 
                                        style={{ backgroundColor: '#D4AF37' }}
                                        onClick={() => {
                                            setImportMode('merge');
                                            // Slight delay so state updates before executing
                                            setTimeout(() => executeImport(false), 0);
                                        }}
                                    >
                                        {t.switchMerge}
                                    </button>
                                )}
                                <button 
                                    className="import-btn-secondary" 
                                    style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                    onClick={() => executeImport(true)} // force replace
                                >
                                    {t.eraseAnyway}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2.6: Smart Bible Merge Conflict */}
                    {step === 'bible-conflict' && bibleStats && (
                        <div className="import-step-conflict" style={{ textAlign: 'center', padding: '24px 0' }}>
                            <AlertTriangle size={64} style={{ color: '#D4AF37', marginBottom: '16px' }} />
                            <h3 style={{ marginTop: 0 }}>{t.bibleConflictTitle}</h3>
                            <p style={{ lineHeight: 1.5, marginBottom: '24px' }}>{t.bibleConflictDesc}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button 
                                    className="import-btn-primary" 
                                    style={{ backgroundColor: '#cda240', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}
                                    onClick={() => executeImport(false, 'device')}
                                >
                                    <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{t.keepDeviceData}</strong>
                                    <div style={{ fontSize: '0.9rem', color: '#f8f9fa', marginTop: '6px', fontWeight: 'normal' }}>
                                        {t.startedOn} {formatDisplayDate(bibleStats.localStart)} • {bibleStats.localCount} {t.daysCompleted}
                                    </div>
                                </button>
                                <button 
                                    className="import-btn-text" 
                                    style={{ color: '#cda240', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', background: 'transparent', border: 'none' }}
                                    onClick={() => executeImport(false, 'backup')}
                                >
                                    <strong style={{ fontSize: '1.05rem' }}>{t.useBackupData}</strong>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--settings-text-secondary)', marginTop: '6px', fontWeight: 'normal' }}>
                                        {t.startedOn} {formatDisplayDate(bibleStats.importedStart)} • {bibleStats.importedCount} {t.daysCompleted}
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 'success' && (
                        <div className="import-step-success">
                            <CheckCircle2 size={64} className="success-icon" />
                            <h3>{t.success}</h3>
                            <button className="import-btn-primary" onClick={onClose}>{t.close}</button>
                            
                            <button className="import-btn-text" onClick={handleUndo} style={{ marginTop: '16px' }}>
                                {t.undo}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
