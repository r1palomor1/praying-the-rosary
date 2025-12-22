import { ResponsiveImage } from './ResponsiveImage';
import './ClassicMysteryView.css';

interface ClassicMysteryViewProps {
    currentStep: any;
    decadeInfo: any;
    userWantsTextHidden: boolean;
    showPrayerText: boolean;
    language: 'en' | 'es';
    renderTextWithHighlighting: (text: string, sentenceOffset?: number) => any;
    beadCount: number;
    currentBead: number;
    spokenIndex: number;
}

export function ClassicMysteryView({
    currentStep,
    decadeInfo,
    userWantsTextHidden,
    showPrayerText,
    language,
    renderTextWithHighlighting,
    beadCount,
    currentBead,
    spokenIndex
}: ClassicMysteryViewProps) {
    // CRITICAL: Use correct prayer type strings (fixed from original implementation)
    const isIntroPrayer = ['sign_of_cross_start', 'intention_placeholder'].includes(currentStep.type);
    const isClosingPrayer = ['final_jaculatory_start', 'final_hail_mary_intro', 'hail_holy_queen',
        'closing_under_your_protection', 'final_collect', 'sign_of_cross_end'].includes(currentStep.type);
    const isReflection = currentStep.type === 'decade_announcement';
    const isLitany = currentStep.type === 'litany_of_loreto';
    const decadePrayerTypes = ['decade_our_father', 'decade_hail_mary', 'decade_glory_be', 'decade_jaculatory', 'fatima_prayer'];
    const isDecadePrayer = decadePrayerTypes.includes(currentStep.type);

    const t = language === 'es' ? {
        reflection: 'Reflexión',
        fruit: 'Fruto:',
        repeatResponse: 'Repetir respuesta de oración:',
        prayForUs: 'Ruega por nosotros'
    } : {
        reflection: 'Reflection',
        fruit: 'Fruit:',
        repeatResponse: 'Repeat prayer response:',
        prayForUs: 'Pray for us'
    };

    // Litany rendering helper
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
            <div className="classic-container">
                <div className="classic-litany-card">
                    <h2 className="litany-title">{currentStep.title}</h2>
                    <div className="litany-container-new">
                        {data.initial_petitions.map((item: any, i: number) => renderLitanyRow(item.call, item.response, i, globalCount++))}

                        {data.trinity_invocations.map((item: any, i: number) => renderLitanyRow(item.call, item.response, i, globalCount++))}

                        {/* Instruction reminder */}
                        <div className="litany-reminder">
                            ({t.repeatResponse} <span className="litany-reminder-highlight">{t.prayForUs}</span>)
                        </div>

                        {/* Mary Invocations - Show first one fully, then only calls */}
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
                </div>
            </div>
        );
    }

    // REFLECTION (Decade Announcement)
    if (isReflection) {
        return (
            <div className="classic-container">
                <div className={`classic-image-container ${userWantsTextHidden ? 'expanded' : 'normal'}`}>
                    {currentStep.imageUrl && (
                        <img
                            src={typeof currentStep.imageUrl === 'string' ? currentStep.imageUrl : currentStep.imageUrl.lg}
                            alt={currentStep.title}
                            className="classic-image"
                        />
                    )}
                </div>

                {!userWantsTextHidden && (
                    <div className="classic-card">
                        <h3 className="classic-card-title">{t.reflection}</h3>
                        <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>

                        {decadeInfo && (decadeInfo.fruit || decadeInfo.scripture) && (
                            <div className="classic-meditation-footer">
                                {/* CRITICAL FIX: Fruit label visible for ALL prayers */}
                                {decadeInfo.fruit && (
                                    <div className="classic-fruit-container">
                                        <h3 className="classic-fruit-label">
                                            {t.fruit} {decadeInfo.fruit}
                                        </h3>
                                    </div>
                                )}

                                {decadeInfo.scripture && (
                                    <div className="classic-scripture-container">
                                        <p className="classic-scripture-text">"{decadeInfo.scripture.text}"</p>
                                        <p className="classic-scripture-ref">{decadeInfo.scripture.reference}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // INTRO PRAYERS
    if (isIntroPrayer) {
        if (currentStep.imageUrl) {
            return (
                <div className="classic-container">
                    <div className={`classic-image-container ${userWantsTextHidden ? 'expanded' : 'normal'}`}>
                        <img
                            src={typeof currentStep.imageUrl === 'string' ? currentStep.imageUrl : currentStep.imageUrl.lg}
                            alt={currentStep.title}
                            className="classic-image"
                        />
                    </div>

                    {!userWantsTextHidden && (
                        <div className="classic-card">
                            <h2 className="classic-card-title">{currentStep.title}</h2>
                            <div className="classic-divider"></div>
                            <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
                        </div>
                    )}
                </div>
            );
        }

        // Fallback for intro prayers without images
        return (
            <div className="classic-container">
                <div className="classic-card">
                    <h2 className="classic-card-title">{currentStep.title}</h2>
                    <div className="classic-divider"></div>
                    <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
                </div>
            </div>
        );
    }

    // CLOSING PRAYERS
    if (isClosingPrayer) {
        if (currentStep.imageUrl) {
            return (
                <div className="classic-container">
                    <div className={`classic-image-container ${userWantsTextHidden ? 'expanded' : 'normal'}`}>
                        <img
                            src={typeof currentStep.imageUrl === 'string' ? currentStep.imageUrl : currentStep.imageUrl.lg}
                            alt={currentStep.title}
                            className="classic-image"
                        />
                    </div>

                    {!userWantsTextHidden && (
                        <div className="classic-card">
                            <h2 className="classic-card-title">{currentStep.title}</h2>
                            <div className="classic-divider"></div>
                            <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="classic-container">
                <div className="classic-card">
                    <h2 className="classic-card-title">{currentStep.title}</h2>
                    <div className="classic-divider"></div>
                    <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
                </div>
            </div>
        );
    }

    // DECADE PRAYERS (Our Father, Hail Mary, Glory Be, etc.)
    if (isDecadePrayer) {
        return (
            <div className="classic-container">
                <div className="classic-card">
                    <h2 className="classic-card-title">{currentStep.title}</h2>

                    {/* CRITICAL FIX: Show fruit label for ALL decade prayers */}
                    {decadeInfo?.fruit && (
                        <div className="classic-fruit-label">
                            {t.fruit} {decadeInfo.fruit}
                        </div>
                    )}

                    <div className="classic-divider"></div>

                    {!userWantsTextHidden && (
                        <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
                    )}

                    {/* Bead counter for Hail Marys - ALWAYS visible */}
                    {currentStep.type === 'decade_hail_mary' && currentStep.hailMaryNumber && (
                        <div className="bead-counter classic-bead-counter">
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
            </div>
        );
    }

    // DEFAULT RENDERING for any other prayer types
    return (
        <div className="classic-container">
            <div className="classic-card">
                <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
            </div>
        </div>
    );
}
