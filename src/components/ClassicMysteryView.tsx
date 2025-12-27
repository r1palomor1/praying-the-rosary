import './ClassicMysteryView.css';

interface ClassicMysteryViewProps {
    currentStep: any;
    decadeInfo: any;
    userWantsTextHidden: boolean;
    language: 'en' | 'es';
    renderTextWithHighlighting: (text: string, sentenceOffset?: number) => any;
    getSentences: (text: string) => string[];
    spokenIndex: number;
}

export function ClassicMysteryView({
    currentStep,
    decadeInfo,
    userWantsTextHidden,
    language,
    renderTextWithHighlighting,
    getSentences,
    spokenIndex
}: ClassicMysteryViewProps) {
    // CRITICAL: Use correct prayer type strings (fixed from original implementation)
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

    // LITANY - Restored original format from commit b58f671
    if (isLitany && currentStep.litanyData) {
        const data = currentStep.litanyData;

        // Helper to render a row with alternating background (full call and response)
        const renderRow = (call: string, response: string, index: number, globalIndex: number) => (
            <div
                key={`${index}-${globalIndex}`}
                className={`litany-row-new ${globalIndex % 2 === 0 ? 'litany-row-highlight' : ''} ${spokenIndex === globalIndex ? 'litany-row-active' : ''}`}
            >
                <div className="litany-call-new">{call}</div>
                <div className="litany-response-new">{response}</div>
            </div>
        );

        // Helper to render call-only row (for Mary invocations after the first)
        const renderCallOnly = (call: string, index: number, globalIndex: number) => (
            <div
                key={`${index}-${globalIndex}`}
                className={`litany-row-new ${globalIndex % 2 === 0 ? 'litany-row-highlight' : ''} ${spokenIndex === globalIndex ? 'litany-row-active' : ''}`}
            >
                <div className="litany-call-new">{call}</div>
            </div>
        );

        let globalCount = 0;

        return (
            <div className="classic-container">
                <div className="classic-card">
                    <div className="prayer-section litany-container-new">
                        <h2 className="litany-title-new">{(currentStep.title || '').toUpperCase()}</h2>

                        <div className="litany-list-new">
                            {data.initial_petitions.map((item: any, i: number) => renderRow(item.call, item.response, i, globalCount++))}

                            {data.trinity_invocations.map((item: any, i: number) => renderRow(item.call, item.response, i, globalCount++))}

                            {/* Instruction reminder before Mary invocations */}
                            <div className="litany-reminder">
                                ({t.repeatResponse} <span className="litany-reminder-highlight">{t.prayForUs}</span>)
                            </div>

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
                </div>
            </div>
        );
    }

    // REFLECTION (Decade Announcement)
    if (isReflection) {
        return (
            <div className="classic-container">
                <div className="classic-card">
                    {/* Title always visible */}
                    <h3 className="classic-card-title">{t.reflection}</h3>

                    {/* Hide reflection text AND scripture when text is hidden */}
                    {!userWantsTextHidden && (
                        <>
                            <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
                        </>
                    )}

                    {/* Fruit always visible with divider line above */}
                    {decadeInfo?.fruit && (
                        <div className="classic-meditation-footer">
                            <div className="classic-fruit-container">
                                <h3 className="classic-fruit-label">
                                    {t.fruit} {decadeInfo.fruit}
                                </h3>
                            </div>
                        </div>
                    )}

                    {/* Scripture after fruit, hidden with text */}
                    {!userWantsTextHidden && decadeInfo?.scripture && (
                        <div className="classic-scripture-container">
                            <p className="classic-scripture-text">"{decadeInfo.scripture.text}"</p>
                            <p className="classic-scripture-ref">{decadeInfo.scripture.reference}</p>
                        </div>
                    )}
                </div>

                {/* Image LAST - moved to bottom to match other prayers */}
                <div className="classic-image-container normal">
                    {currentStep.imageUrl && (
                        <>
                            {/* Blurred background layer */}
                            <img
                                src={typeof currentStep.imageUrl === 'string' ? currentStep.imageUrl : currentStep.imageUrl.lg}
                                alt=""
                                className="classic-image-blur"
                            />
                            {/* Clear main image on top */}
                            <img
                                src={typeof currentStep.imageUrl === 'string' ? currentStep.imageUrl : currentStep.imageUrl.lg}
                                alt={currentStep.title}
                                className="classic-image"
                            />
                        </>
                    )}
                </div>
            </div>
        );
    }

    // INTRO PRAYERS
    if (isIntroPrayer) {
        if (currentStep.imageUrl) {
            return (
                <div className="classic-container">
                    <div className="classic-card">
                        {/* Title always visible */}
                        <h2 className="classic-card-title">{(currentStep.title || '').toUpperCase()}</h2>

                        {/* Only hide text and divider */}
                        {!userWantsTextHidden && (
                            <>
                                <div className="classic-divider"></div>
                                <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
                            </>
                        )}
                    </div>

                    <div className={`classic-image-container ${userWantsTextHidden ? 'expanded' : 'normal'}`}>
                        <img
                            src={typeof currentStep.imageUrl === 'string' ? currentStep.imageUrl : currentStep.imageUrl.lg}
                            alt=""
                            className="classic-image-blur"
                        />
                        <img
                            src={typeof currentStep.imageUrl === 'string' ? currentStep.imageUrl : currentStep.imageUrl.lg}
                            alt={currentStep.title}
                            className="classic-image"
                        />
                    </div>
                </div>
            );
        }

        // Fallback for intro prayers without images
        return (
            <div className="classic-container">
                <div className="classic-card">
                    <h2 className="classic-card-title">{(currentStep.title || '').toUpperCase()}</h2>
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
                    <div className="classic-card">
                        {/* Title always visible */}
                        <h2 className="classic-card-title">{(currentStep.title || '').toUpperCase()}</h2>

                        {/* Only hide text and divider */}
                        {!userWantsTextHidden && (
                            <>
                                <div className="classic-divider"></div>
                                {/* Handle Final Hail Marys with two parts */}
                                {currentStep.type === 'final_hail_mary_intro' ? (
                                    (() => {
                                        const parts = currentStep.text.split('\n\n');
                                        const part0Sentences = getSentences(parts[0]);
                                        const sentenceOffset = part0Sentences.length;
                                        return (
                                            <>
                                                <p className="classic-text">
                                                    {renderTextWithHighlighting(parts[0])}
                                                </p>
                                                {parts[1] && (
                                                    <p className="classic-text mt-4">
                                                        {renderTextWithHighlighting(parts[1], sentenceOffset)}
                                                    </p>
                                                )}
                                            </>
                                        );
                                    })()
                                ) : (
                                    <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
                                )}
                            </>
                        )}
                    </div>

                    <div className={`classic-image-container ${userWantsTextHidden ? 'expanded' : 'normal'}`}>
                        <img
                            src={typeof currentStep.imageUrl === 'string' ? currentStep.imageUrl : currentStep.imageUrl.lg}
                            alt=""
                            className="classic-image-blur"
                        />
                        <img
                            src={typeof currentStep.imageUrl === 'string' ? currentStep.imageUrl : currentStep.imageUrl.lg}
                            alt={currentStep.title}
                            className="classic-image"
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="classic-container">
                <div className="classic-card">
                    <h2 className="classic-card-title">{currentStep.title}</h2>
                    <div className="classic-divider"></div>
                    {/* Handle Final Hail Marys with two parts */}
                    {currentStep.type === 'final_hail_mary_intro' ? (
                        (() => {
                            const parts = currentStep.text.split('\n\n');
                            const part0Sentences = getSentences(parts[0]);
                            const sentenceOffset = part0Sentences.length;
                            return (
                                <>
                                    <p className="classic-text">
                                        {renderTextWithHighlighting(parts[0])}
                                    </p>
                                    {parts[1] && (
                                        <p className="classic-text mt-4">
                                            {renderTextWithHighlighting(parts[1], sentenceOffset)}
                                        </p>
                                    )}
                                </>
                            );
                        })()
                    ) : (
                        <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
                    )}
                </div>
            </div>
        );
    }

    // DECADE PRAYERS (Our Father, Hail Mary, Glory Be, etc.)
    if (isDecadePrayer) {
        // Check currentStep.imageUrl first (for Sacred Prayers), then decadeInfo.imageUrl (for Rosary)
        const imageUrl = currentStep.imageUrl || decadeInfo?.imageUrl;

        return (
            <div className="classic-container">
                <div className={`classic-card ${userWantsTextHidden ? 'collapsed' : ''}`}>
                    <h2 className="classic-card-title">{currentStep.title}</h2>

                    {/* CRITICAL FIX: Show fruit label for ALL decade prayers */}
                    {decadeInfo?.fruit && (
                        <div className="classic-fruit-label">
                            {t.fruit} {decadeInfo.fruit}
                        </div>
                    )}

                    <div className="classic-divider"></div>

                    {!userWantsTextHidden && (
                        <>
                            {/* Handle Hail Marys with two parts (call and response) */}
                            {currentStep.type === 'decade_hail_mary' || currentStep.type === 'final_hail_mary_intro' ? (
                                (() => {
                                    const parts = currentStep.text.split('\n\n');
                                    const part0Sentences = getSentences(parts[0]);
                                    const sentenceOffset = part0Sentences.length;
                                    return (
                                        <>
                                            <p className="classic-text">
                                                {renderTextWithHighlighting(parts[0])}
                                            </p>
                                            {parts[1] && (
                                                <p className="classic-text mt-4">
                                                    {renderTextWithHighlighting(parts[1], sentenceOffset)}
                                                </p>
                                            )}
                                        </>
                                    );
                                })()
                            ) : (
                                <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
                            )}
                        </>
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

                {/* Image below text for decade prayers */}
                {imageUrl && (
                    <div className={`classic-image-container ${userWantsTextHidden ? 'expanded' : 'normal'}`}>
                        <img
                            src={typeof imageUrl === 'string' ? imageUrl : imageUrl.lg}
                            alt=""
                            className="classic-image-blur"
                        />
                        <img
                            src={typeof imageUrl === 'string' ? imageUrl : imageUrl.lg}
                            alt={currentStep.title}
                            className="classic-image"
                        />
                    </div>
                )}
            </div>
        );
    }

    // DEFAULT RENDERING for any other prayer types
    return (
        <div className="classic-container">
            <div className="classic-card">
                {currentStep.title && (
                    <>
                        <h2 className="classic-card-title">{currentStep.title}</h2>
                        <div className="classic-divider"></div>
                    </>
                )}
                <p className="classic-text">{renderTextWithHighlighting(currentStep.text)}</p>
            </div>
        </div>
    );
}
