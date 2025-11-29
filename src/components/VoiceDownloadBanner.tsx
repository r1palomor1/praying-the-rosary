import { useState, useEffect } from 'react';
import { Download, X, Loader } from 'lucide-react';
import * as piperTTS from '../utils/piperTTS';
import { useApp } from '../context/AppContext';
import './VoiceDownloadBanner.css';

declare global {
    interface Window {
        piperRetryDone?: boolean;
    }
}

export function VoiceDownloadBanner() {
    const { language } = useApp();
    const [show, setShow] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        checkVoiceStatus();
    }, [language]);

    async function checkVoiceStatus() {
        // Check if user dismissed banner
        const dismissedKey = `voice-download-dismissed-final-${language}`;
        if (localStorage.getItem(dismissedKey) === 'true') {
            setDismissed(true);
            return;
        }

        // Check if voices are already downloaded
        const hasVoices = await piperTTS.hasVoicesForLanguage(language);
        const supported = piperTTS.isPiperSupported();

        // If not supported yet, it might be initializing. Retry once after a delay.
        if (!supported && !window.piperRetryDone) {
            window.piperRetryDone = true;
            setTimeout(() => checkVoiceStatus(), 2000);
            return;
        }

        // Show banner if Piper is supported but voices not downloaded
        setShow(supported && !hasVoices && !dismissed);
    }

    async function handleDownload() {
        setDownloading(true);

        try {
            await piperTTS.downloadVoices(language, (progressInfo) => {
                const percent = Math.round((progressInfo.loaded / progressInfo.total) * 100);
                setProgress(percent);
            });

            // Download complete
            setShow(false);
            setDownloading(false);

            // Show success message
            alert(language === 'en'
                ? 'Better voices downloaded successfully! Audio quality improved.'
                : '¡Voces mejoradas descargadas con éxito! Calidad de audio mejorada.');

        } catch (error) {
            console.error('Download failed:', error);
            setDownloading(false);
            alert(language === 'en'
                ? 'Download failed. Please try again later.'
                : 'Descarga fallida. Por favor, inténtelo de nuevo más tarde.');
        }
    }

    function handleDismiss() {
        const dismissedKey = `voice-download-dismissed-final-${language}`;
        localStorage.setItem(dismissedKey, 'true');
        setShow(false);
        setDismissed(true);
    }

    if (!show) return null;

    const t = language === 'es' ? {
        title: '¿Descargar voces mejoradas?',
        description: `Mejore la calidad del audio con voces más naturales (~${piperTTS.getDownloadSize(language)}MB, una sola vez)`,
        download: 'Descargar',
        later: 'Más tarde',
        downloading: 'Descargando...'
    } : {
        title: 'Download Better Voices?',
        description: `Improve audio quality with more natural voices (~${piperTTS.getDownloadSize(language)}MB, one-time)`,
        download: 'Download',
        later: 'Later',
        downloading: 'Downloading...'
    };

    return (
        <div className="voice-download-banner">
            <div className="banner-content">
                <div className="banner-icon">
                    {downloading ? (
                        <Loader className="spinner" size={24} />
                    ) : (
                        <Download size={24} />
                    )}
                </div>
                <div className="banner-text">
                    <div className="banner-title">{t.title}</div>
                    <div className="banner-description">{t.description}</div>
                    {downloading && (
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%`, backgroundColor: 'white', transition: 'width 0.3s ease', borderRadius: '2px', height: '100%' }}
                            />
                        </div>
                    )}
                </div>
                <div className="banner-actions">
                    {!downloading && (
                        <>
                            <button
                                className="btn-download"
                                onClick={handleDownload}
                            >
                                {t.download}
                            </button>
                            <button
                                className="btn-dismiss"
                                onClick={handleDismiss}
                                aria-label={t.later}
                            >
                                <X size={20} />
                            </button>
                        </>
                    )}
                    {downloading && (
                        <span className="download-percent">{progress}%</span>
                    )}
                </div>
            </div>
        </div>
    );
}
