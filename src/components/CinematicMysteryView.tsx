import { ResponsiveImage } from './ResponsiveImage';
import './CinematicMysteryView.css';

interface CinematicMysteryViewProps {
    currentStep: any;
    decadeInfo: any;
    showPrayerText: boolean;
    language: 'en' | 'es';
    renderTextWithHighlighting: (text: string, sentenceOffset?: number) => any;
    getSentences: (text: string) => string[];
    spokenIndex: number;
    revealedRows: number[];
}

export function CinematicMysteryView({
    currentStep,
    decadeInfo,
    showPrayerText,
    language,
    renderTextWithHighlighting,
    getSentences,
    spokenIndex,
    revealedRows
}: CinematicMysteryViewProps) {
    // CRITICAL: Use correct prayer type strings (fixed from original)
    const isIntroPrayer = ['sign_of_cross_start', 'opening_invocation', 'act_of_contrition',
        'apostles_creed', 'invocation_holy_spirit', 'intention_placeholder'].includes(currentStep.type);
    const isClosingPrayer = ['final_jaculatory_start', 'final_hail_mary_intro', 'hail_holy_queen',
        'closing_under_your_protection', 'final_collect', 'sign_of_cross_end'].includes(currentStep.type);
    const isReflection = currentStep.type === 'decade_announcement';
    const isLitany = currentStep.type === 'litany_of_loreto';
    const decadePrayerTypes = [
        'decade_our_father', 'decade_hail_mary', 'decade_glory_be', 'decade_jaculatory', 'fatima_prayer',
        'our_father', 'hail_mary', 'glory_be', 'jaculatory' // Sacred Prayers use these types
    ];
    const isDecadePrayer = decadePrayerTypes.includes(currentStep.type);

    const t = language === 'es' ? {
        reflection: 'REFLEXIÓN',
        fruit: 'FRUTO: ',
        repeatResponse: 'Repetir respuesta de oración:',
        prayForUs: 'Ruega por nosotros'
    } : {
        reflection: 'REFLECTION',
        fruit: 'FRUIT: ',
        repeatResponse: 'Repeat prayer response:',
        prayForUs: 'Pray for us'
    };

    // Get image URL
    const imageUrl = decadeInfo?.imageUrl || currentStep.imageUrl;


    // LITANY - Progressive reveal with fade-in
    if (isLitany && currentStep.litanyData) {
        const data = currentStep.litanyData;

        // Helper to render a row with alternating background (full call and response)
        const renderRow = (call: string, response: string, index: number, globalIndex: number) => {
            if (!revealedRows.includes(globalIndex)) return null;
            return (
                <div
                    key={`${index}-${globalIndex}`}
                    className={`litany-row-new litany-row-fade-in ${globalIndex % 2 === 0 ? 'litany-row-highlight' : ''} ${spokenIndex === globalIndex ? 'litany-row-active' : ''}`}
                >
                    <div className="litany-call-new">{call}</div>
                    <div className="litany-response-new">{response}</div>
                </div>
            );
        };

        // Helper to render call-only row (for Mary invocations after the first)
        const renderCallOnly = (call: string, index: number, globalIndex: number) => {
            if (!revealedRows.includes(globalIndex)) return null;
            return (
                <div
                    key={`${index}-${globalIndex}`}
                    className={`litany-row-new litany-row-fade-in ${globalIndex % 2 === 0 ? 'litany-row-highlight' : ''} ${spokenIndex === globalIndex ? 'litany-row-active' : ''}`}
                >
                    <div className="litany-call-new">{call}</div>
                </div>
            );
        };

        let globalCount = 0;

        return (
            <div className="cinematic-container">
                {/* 4-Layer Background System */}
                <div className="cinematic-background">
                    {imageUrl && (
                        <>
                            <ResponsiveImage imageUrl={imageUrl} className="cinematic-bg-blur" alt="" />
                            <ResponsiveImage imageUrl={imageUrl} alt={currentStep.title} className="cinematic-image" loading="lazy" />
                        </>
                    )}
                    <div className="cinematic-overlay"></div>
                </div>

                <div className="cinematic-content">
                    <main className="cinematic-main">
                        <div className="prayer-section litany-container-new">
                            <h2 className="litany-title-new">{(currentStep.title || '').toUpperCase()}</h2>

                            <div className="litany-list-new">
                                {data.initial_petitions.map((item: any, i: number) => renderRow(item.call, item.response, i, globalCount++))}

                                {data.trinity_invocations.map((item: any, i: number) => renderRow(item.call, item.response, i, globalCount++))}

                                {/* Instruction reminder before Mary invocations - only show when we reach this section */}
                                {revealedRows.some(row => row >= 9) && (
                                    <div className="litany-reminder">
                                        ({t.repeatResponse} <span className="litany-reminder-highlight">{t.prayForUs}</span>)
                                    </div>
                                )}

                                {/* Mary Invocations - Show first one fully, then only calls */}
                                {data.mary_invocations.map((item: any, i: number) => {
                                    const response = item.response || t.prayForUs;
                                    if (i === 0) {
                                        return renderRow(item.call, response, i, globalCount++);
                                    } else {
                                        return renderCallOnly(item.call, i, globalCount++);
                                    }
                                })}

                                {data.agnus_dei.map((item: any, i: number) => renderRow(item.call, item.response, i, globalCount++))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // REFLECTION (Decade Announcement)
    if (isReflection) {
        return (
            <div className="cinematic-container">
                {/* 4-Layer Background System */}
                <div className="cinematic-background">
                    {imageUrl && (
                        <>
                            <ResponsiveImage imageUrl={imageUrl} className="cinematic-bg-blur" alt="" />
                            <ResponsiveImage imageUrl={imageUrl} alt={currentStep.title} className="cinematic-image" loading="lazy" />
                        </>
                    )}
                    <div className="cinematic-overlay-darker"></div>
                </div>

                {/* CRITICAL: Reflection content always visible - no text-hidden class */}
                <div className="cinematic-content">
                    <main className="cinematic-main">
                        <div className="text-center space-y-6">
                            {/* CRITICAL: Title always visible */}
                            <h3 className="cinematic-title">{t.reflection}</h3>

                            {/* Reflection text, fruit, and scripture always visible (exception to text toggle) */}
                            <div className="space-y-4 text-center">
                                {/* Reflection text always visible */}
                                <div className="max-w-2xl mx-auto px-6">
                                    <p className="cinematic-text">
                                        {renderTextWithHighlighting(currentStep.text)}
                                    </p>
                                </div>

                                {/* Fruit and scripture always visible */}
                                {decadeInfo && (decadeInfo.fruit || decadeInfo.scripture) && (
                                    <div className="pt-2">
                                        {decadeInfo.fruit && (
                                            <div className="cinematic-fruit-label">
                                                <span>{t.fruit}</span>
                                                <span>{decadeInfo.fruit.toUpperCase()}</span>
                                            </div>
                                        )}
                                        {decadeInfo.scripture && (
                                            <div className="max-w-2xl mx-auto px-6">
                                                <blockquote className="cinematic-scripture">
                                                    <p className="cinematic-scripture-text">
                                                        "{decadeInfo.scripture.text}"
                                                    </p>
                                                    <footer className="cinematic-scripture-ref">
                                                        {decadeInfo.scripture.reference}
                                                    </footer>
                                                </blockquote>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // INTRO PRAYERS
    if (isIntroPrayer && imageUrl) {
        return (
            <div className="cinematic-container">
                {/* 4-Layer Background System */}
                <div className="cinematic-background">
                    <ResponsiveImage imageUrl={imageUrl} className="cinematic-bg-blur" alt="" />
                    <ResponsiveImage imageUrl={imageUrl} alt={currentStep.title} className="cinematic-image" loading="lazy" />
                    <div className="cinematic-overlay-darker"></div>
                </div>

                <div className={`cinematic-content ${!showPrayerText ? 'text-hidden' : ''}`}>
                    <main className="cinematic-main flex flex-col h-full">
                        <div className="text-center space-y-4">
                            {/* CRITICAL: Title always visible */}
                            <h1 className="cinematic-title">
                                {(currentStep.title || '').toUpperCase()}
                            </h1>

                            {/* CRITICAL: Only hide text, not title */}
                            <div className="max-w-2xl mx-auto px-6">
                                <p className="cinematic-text">
                                    {renderTextWithHighlighting(currentStep.text)}
                                </p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // CLOSING PRAYERS
    if (isClosingPrayer && imageUrl) {
        return (
            <div className="cinematic-container">
                {/* 4-Layer Background System */}
                <div className="cinematic-background">
                    <ResponsiveImage imageUrl={imageUrl} className="cinematic-bg-blur" alt="" />
                    <ResponsiveImage imageUrl={imageUrl} alt={currentStep.title} className="cinematic-image" loading="lazy" />
                    <div className="cinematic-overlay-darker"></div>
                </div>

                <div className={`cinematic-content ${!showPrayerText ? 'text-hidden' : ''}`}>
                    <main className="cinematic-main flex flex-col h-full">
                        <div className="text-center space-y-4">
                            {/* CRITICAL: Title always visible */}
                            <h1 className="cinematic-title">
                                {(currentStep.title || '').toUpperCase()}
                            </h1>

                            <div className="max-w-2xl mx-auto px-6">
                                {/* Handle Final Hail Marys with two parts */}
                                {currentStep.type === 'final_hail_mary_intro' ? (
                                    (() => {
                                        const parts = currentStep.text.split('\n\n');
                                        const part0Sentences = getSentences(parts[0]);
                                        const sentenceOffset = part0Sentences.length;
                                        return (
                                            <>
                                                <p className="cinematic-text">
                                                    {renderTextWithHighlighting(parts[0])}
                                                </p>
                                                {parts[1] && (
                                                    <p className="cinematic-text mt-4">
                                                        {renderTextWithHighlighting(parts[1], sentenceOffset)}
                                                    </p>
                                                )}
                                            </>
                                        );
                                    })()
                                ) : (
                                    <p className="cinematic-text">
                                        {renderTextWithHighlighting(currentStep.text)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // DECADE PRAYERS (Our Father, Hail Mary, Glory Be, etc.)
    if (isDecadePrayer) {
        return (
            <div className="cinematic-container">
                {/* 4-Layer Background System */}
                <div className="cinematic-background">
                    {imageUrl && (
                        <>
                            <ResponsiveImage imageUrl={imageUrl} className="cinematic-bg-blur" alt="" />
                            <ResponsiveImage imageUrl={imageUrl} alt={decadeInfo?.title || currentStep.title} className="cinematic-image" loading="lazy" />
                        </>
                    )}
                    <div className="cinematic-overlay"></div>
                </div>

                <div className={`cinematic-content ${!showPrayerText ? 'text-hidden' : ''}`}>
                    <main className="cinematic-main">
                        <div className="text-center space-y-4">
                            {/* Title and Fruit grouped together - ALWAYS VISIBLE */}
                            <div className="space-y-2">
                                <h1 className="cinematic-title">
                                    {(currentStep.title || '').toUpperCase()}
                                </h1>

                                {/* CRITICAL FIX: Show Fruit for ALL decade prayers */}
                                {currentStep.decadeNumber && decadeInfo?.fruit && (
                                    <div className="cinematic-fruit-label">
                                        <span>{t.fruit}</span>
                                        <span>{decadeInfo.fruit.toUpperCase()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Prayer text - can be hidden */}
                            <div className="max-w-2xl mx-auto px-6">
                                {/* Handle Hail Marys with two parts (call and response) */}
                                {currentStep.type === 'decade_hail_mary' ? (
                                    (() => {
                                        const parts = currentStep.text.split('\n\n');
                                        const part0Sentences = getSentences(parts[0]);
                                        const sentenceOffset = part0Sentences.length;
                                        return (
                                            <>
                                                <p className="cinematic-text">
                                                    {renderTextWithHighlighting(parts[0])}
                                                </p>
                                                {parts[1] && (
                                                    <p className="cinematic-text mt-4">
                                                        {renderTextWithHighlighting(parts[1], sentenceOffset)}
                                                    </p>
                                                )}
                                            </>
                                        );
                                    })()
                                ) : (
                                    <p className="cinematic-text">
                                        {renderTextWithHighlighting(currentStep.text)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </main>
                </div>

                {/* CRITICAL FIX: Bead Counter OUTSIDE cinematic-main, positioned at bottom 15% */}
                {currentStep.type === 'decade_hail_mary' && currentStep.hailMaryNumber && (
                    <div className="bead-counter cinematic-bead-counter">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bead) => (
                            <div
                                key={bead}
                                className={`bead ${bead <= currentStep.hailMaryNumber! ? 'bead-active' : ''}`}
                            >
                                {bead <= currentStep.hailMaryNumber! && (
                                    <span className="bead-number">{bead}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // DEFAULT RENDERING
    return (
        <div className="cinematic-container">
            <div className="cinematic-background">
                {imageUrl && (
                    <>
                        <ResponsiveImage imageUrl={imageUrl} className="cinematic-bg-blur" alt="" />
                        <ResponsiveImage imageUrl={imageUrl} alt={currentStep.title} className="cinematic-image" loading="lazy" />
                    </>
                )}
                <div className="cinematic-overlay"></div>
            </div>

            <div className={`cinematic-content ${!showPrayerText ? 'text-hidden' : ''}`}>
                <main className="cinematic-main">
                    <p className="cinematic-text">
                        {renderTextWithHighlighting(currentStep.text)}
                    </p>
                </main>
            </div>
        </div>
    );
}
