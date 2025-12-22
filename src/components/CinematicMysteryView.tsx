import { ResponsiveImage } from './ResponsiveImage';
import './CinematicMysteryView.css';

interface CinematicMysteryViewProps {
    currentStep: any;
    decadeInfo: any;
    userWantsTextHidden: boolean;
    showPrayerText: boolean;
    language: 'en' | 'es';
    renderTextWithHighlighting: (text: string, sentenceOffset?: number) => any;
    getSentences: (text: string) => string[];
    beadCount: number;
    currentBead: number;
    debugBaseOpacity: number;
    debugSecondaryOpacity: number;
    spokenIndex: number;
}

export function CinematicMysteryView({
    currentStep,
    decadeInfo,
    userWantsTextHidden,
    showPrayerText,
    language,
    renderTextWithHighlighting,
    getSentences,
    beadCount,
    currentBead,
    debugBaseOpacity,
    debugSecondaryOpacity,
    spokenIndex
}: CinematicMysteryViewProps) {
    // CRITICAL: Use correct prayer type strings (fixed from original)
    const isIntroPrayer = ['sign_of_cross_start', 'intention_placeholder'].includes(currentStep.type);
    const isClosingPrayer = ['final_jaculatory_start', 'final_hail_mary_intro', 'hail_holy_queen',
        'closing_under_your_protection', 'final_collect', 'sign_of_cross_end'].includes(currentStep.type);
    const isReflection = currentStep.type === 'decade_announcement';
    const isLitany = currentStep.type === 'litany_of_loreto';
    const decadePrayerTypes = ['decade_our_father', 'decade_hail_mary', 'decade_glory_be', 'decade_jaculatory', 'fatima_prayer'];
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

    // Litany rendering helpers
    const renderLitanyRow = (call: string, response: string, index: number, globalCount: number) => (
        <div key={globalCount} className={`litany-row-new ${spokenIndex === globalCount ? 'litany-row-active' : ''}`}>
            <div className="litany-call-new">{call}</div>
            {response && <div className="litany-response-new">{response}</div>}
        </div>
    );

    const renderLitanyCallOnly = (call: string, index: number, globalCount: number) => (
        <div key={globalCount} className={`litany-row-new ${spokenIndex === globalCount ? 'litany-row-active' : ''}`}>
            <div className="litany-call-new">{call}</div>
        </div>
    );

    // LITANY - Use centralized styling from index.css
    if (isLitany && currentStep.litanyData) {
        const data = currentStep.litanyData;
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
                        <h1 className="litany-title">{currentStep.title}</h1>
                        <div className="litany-container-new">
                            {data.initial_petitions.map((item: any, i: number) => renderLitanyRow(item.call, item.response, i, globalCount++))}

                            {data.trinity_invocations.map((item: any, i: number) => renderLitanyRow(item.call, item.response, i, globalCount++))}

                            <div className="litany-reminder">
                                ({t.repeatResponse} <span className="litany-reminder-highlight">{t.prayForUs}</span>)
                            </div>

                            {data.mary_invocations.map((item: any, i: number) => {
                                const response = item.response || t.prayForUs;
                                if (i === 0) {
                                    return renderLitanyRow(item.call, response, i, globalCount++);
                                } else {
                                    return renderLitanyCallOnly(item.call, i, globalCount++);
                                }
                            })}

                            {data.agnus_dei.map((item: any, i: number) => renderLitanyRow(item.call, item.response, i, globalCount++))}
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

                <div className={`cinematic-content ${!showPrayerText ? 'text-hidden' : ''}`}>
                    <main className="cinematic-main">
                        <div className="text-center space-y-6">
                            {/* CRITICAL: Title always visible */}
                            <div className="space-y-4 pt-4 text-center">
                                <h3 className="cinematic-title">{t.reflection}</h3>
                                {/* CRITICAL: Only hide text, not title */}
                                <p className="cinematic-text">
                                    {renderTextWithHighlighting(currentStep.text)}
                                </p>
                            </div>

                            {/* CRITICAL: Fruit and scripture always visible when present */}
                            {decadeInfo && (decadeInfo.fruit || decadeInfo.scripture) && (
                                <div className="pt-8">
                                    {decadeInfo.fruit && (
                                        <div className="cinematic-fruit-label">
                                            <span>{t.fruit}</span>
                                            <span>{decadeInfo.fruit.toUpperCase()}</span>
                                        </div>
                                    )}
                                    {decadeInfo.scripture && (
                                        <blockquote className="cinematic-scripture">
                                            <p className="cinematic-scripture-text">
                                                "{decadeInfo.scripture.text}"
                                            </p>
                                            <footer className="cinematic-scripture-ref">
                                                {decadeInfo.scripture.reference}
                                            </footer>
                                        </blockquote>
                                    )}
                                </div>
                            )}
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
                        <div className="text-center space-y-8">
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
                        <div className="text-center space-y-8">
                            {/* CRITICAL: Title always visible */}
                            <h1 className="cinematic-title mb-8">
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
                    <main className="cinematic-main flex flex-col h-full">
                        <div className="text-center space-y-8">
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
                                <p className="cinematic-text">
                                    {renderTextWithHighlighting(currentStep.text)}
                                </p>
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
