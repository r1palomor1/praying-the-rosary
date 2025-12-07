// Prayer Flow Engine - Manages sequential progression through the complete Rosary
// Flow: Opening Prayers → 5 Decades (each with Our Father, 10 Hail Marys, Glory Be, Fatima Prayer) → Closing Prayers

import { prayerData, type Language } from '../data/prayerData';
import { prayers } from '../data/prayers';
import { mysterySets } from '../data/mysteries';

export type PrayerStepType =
    | 'sign_of_cross_start'
    | 'opening_invocation'
    | 'act_of_contrition'
    | 'apostles_creed'
    | 'invocation_holy_spirit'
    | 'intention_placeholder'
    | 'decade_announcement' // Shows mystery title and reflection
    | 'decade_our_father'
    | 'decade_hail_mary' // Repeats 10 times
    | 'decade_glory_be'
    | 'decade_jaculatory'
    | 'fatima_prayer'
    | 'final_jaculatory_start'
    | 'final_hail_mary_intro' // 3 special Hail Marys
    | 'hail_holy_queen'
    | 'litany_of_loreto' // Consolidated litany step
    | 'closing_under_your_protection'
    | 'final_collect'
    | 'sign_of_cross_end'
    | 'complete';

export interface PrayerStep {
    type: PrayerStepType;
    text: string;
    title?: string;
    decadeNumber?: number; // 1-5 for decades
    hailMaryNumber?: number; // 1-10 within a decade
    finalHailMaryNumber?: number; // 1-3 for final Hail Marys
    litanySection?: 'initial' | 'trinity' | 'mary' | 'agnus'; // For litany subsections
    litanyIndex?: number; // Index within litany section
    litanyData?: any; // Full litany data for scrollable view
    imageUrl?: string; // Image URL for the mystery
}

export type MysteryType = 'joyful' | 'luminous' | 'sorrowful' | 'glorious';

export class PrayerFlowEngine {
    private mysteryType: MysteryType;
    private language: Language;
    private currentStepIndex: number = 0;
    private steps: PrayerStep[] = [];

    constructor(mysteryType: MysteryType, language: Language = 'en') {
        this.mysteryType = mysteryType;
        this.language = language;
        this.buildPrayerSequence();
    }

    private getOrdinal(num: number): string {
        if (this.language === 'es') {
            const ordinals = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto'];
            return ordinals[num - 1] || `${num}º`;
        }
        // English ordinals
        const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
        return ordinals[num - 1] || `${num}th`;
    }

    private buildPrayerSequence(): void {
        const data = prayerData[this.language];
        const { fixed_prayers, mysteries_data } = data;
        const mysteries = mysteries_data[this.mysteryType];
        this.steps = [];

        const t = this.getTranslations();

        // 1. Opening Prayers
        const introPrayerImage = '/images/intro-prayers.webp';

        this.steps.push({
            type: 'sign_of_cross_start',
            text: fixed_prayers.sign_of_cross_start,
            title: t.signOfCross,
            imageUrl: introPrayerImage
        });

        this.steps.push({
            type: 'opening_invocation',
            text: fixed_prayers.opening_invocation,
            title: t.openingInvocation,
            imageUrl: introPrayerImage
        });

        this.steps.push({
            type: 'act_of_contrition',
            text: fixed_prayers.act_of_contrition,
            title: t.actOfContrition,
            imageUrl: introPrayerImage
        });

        this.steps.push({
            type: 'apostles_creed',
            text: fixed_prayers.apostles_creed,
            title: t.apostlesCreed,
            imageUrl: introPrayerImage
        });

        this.steps.push({
            type: 'invocation_holy_spirit',
            text: fixed_prayers.invocation_holy_spirit,
            title: t.invocationHolySpirit,
            imageUrl: introPrayerImage
        });

        this.steps.push({
            type: 'intention_placeholder',
            text: fixed_prayers.intention_placeholder,
            title: t.intentions,
            imageUrl: introPrayerImage
        });

        // 2. Five Decades
        for (let decadeNum = 1; decadeNum <= 5; decadeNum++) {
            const decade = mysteries.decades[decadeNum - 1];

            // Find image URL from mysterySets
            const mysterySet = mysterySets.find(s => s.type === this.mysteryType);
            const mystery = mysterySet?.mysteries.find(m => m.number === decadeNum);
            const imageUrl = mystery?.imageUrl;

            // Decade announcement (mystery title + reflection)
            // Use full ordinal word for better audio (e.g., "First Mystery" instead of "1st Mystery")
            const ordinal = this.getOrdinal(decadeNum);
            this.steps.push({
                type: 'decade_announcement',
                text: decade.reflection,
                title: `${ordinal} ${t.mystery}: ${decade.title}`,
                decadeNumber: decadeNum,
                imageUrl: imageUrl
            });

            // Our Father
            this.steps.push({
                type: 'decade_our_father',
                text: fixed_prayers.decade_our_father,
                title: t.ourFather,
                decadeNumber: decadeNum
            });

            // 10 Hail Marys
            for (let hailMaryNum = 1; hailMaryNum <= 10; hailMaryNum++) {
                this.steps.push({
                    type: 'decade_hail_mary',
                    text: fixed_prayers.decade_hail_mary,
                    title: `${t.hailMary} ${hailMaryNum}/10`,
                    decadeNumber: decadeNum,
                    hailMaryNumber: hailMaryNum
                });
            }

            // Glory Be
            this.steps.push({
                type: 'decade_glory_be',
                text: fixed_prayers.decade_glory_be,
                title: t.gloryBe,
                decadeNumber: decadeNum
            });

            // Jaculatory
            this.steps.push({
                type: 'decade_jaculatory',
                text: fixed_prayers.decade_jaculatory,
                title: t.jaculatory,
                decadeNumber: decadeNum
            });

            // Fatima Prayer
            this.steps.push({
                type: 'fatima_prayer',
                text: fixed_prayers.fatima_prayer,
                title: t.fatimaPrayer,
                decadeNumber: decadeNum
            });
        }

        // 3. Closing Prayers
        const closingPrayerImage = '/images/closing-prayers.webp';

        this.steps.push({
            type: 'final_jaculatory_start',
            text: fixed_prayers.final_jaculatory_start,
            title: t.finalJaculatory,
            imageUrl: closingPrayerImage
        });

        // Final Hail Marys with invocations (now 4 instead of 3)
        for (let i = 0; i < fixed_prayers.final_hail_marys_intro.length; i++) {
            const intro = fixed_prayers.final_hail_marys_intro[i];
            // Only concatenate prayer if it exists (4th item has no prayer)
            const prayerText = intro.prayer ? `${intro.invocation}\n\n${intro.prayer}` : intro.invocation;
            this.steps.push({
                type: 'final_hail_mary_intro',
                text: prayerText,
                title: `${t.hailMary} ${i + 1}/${fixed_prayers.final_hail_marys_intro.length}`,
                finalHailMaryNumber: i + 1,
                imageUrl: closingPrayerImage
            });
        }

        this.steps.push({
            type: 'hail_holy_queen',
            text: fixed_prayers.hail_holy_queen,
            title: t.hailHolyQueen,
            imageUrl: closingPrayerImage
        });

        // Litany of Loreto - Consolidated into one scrollable step
        const litany = fixed_prayers.litany_of_loreto;

        this.steps.push({
            type: 'litany_of_loreto',
            text: prayers.closing.litany.text[this.language],
            title: prayers.closing.litany.name[this.language],
            litanyData: litany // Pass the structured data for rendering
        });

        this.steps.push({
            type: 'closing_under_your_protection',
            text: fixed_prayers.closing_under_your_protection,
            title: t.underYourProtection,
            imageUrl: closingPrayerImage
        });

        this.steps.push({
            type: 'final_collect',
            text: fixed_prayers.final_collect,
            title: t.finalPrayer,
            imageUrl: closingPrayerImage
        });

        this.steps.push({
            type: 'sign_of_cross_end',
            text: fixed_prayers.sign_of_cross_end,
            title: t.signOfCross,
            imageUrl: closingPrayerImage
        });

        this.steps.push({
            type: 'complete',
            text: t.completed,
            title: t.completedTitle
        });
    }

    private getTranslations() {
        if (this.language === 'es') {
            return {
                signOfCross: 'Señal de la Cruz',
                openingInvocation: 'Invocación Inicial',
                actOfContrition: 'Acto de Contrición',
                apostlesCreed: 'Credo de los Apóstoles',
                invocationHolySpirit: 'Invocación al Espíritu Santo',
                intentions: 'Momento de Intenciones',
                mystery: 'Misterio',
                mysteryOrdinal: 'º',
                ourFather: 'Padre Nuestro',
                hailMary: 'Ave María',
                gloryBe: 'Gloria',
                jaculatory: 'Jaculatoria',
                fatimaPrayer: 'Oración de Fátima',
                finalJaculatory: 'Jaculatoria Final',
                hailHolyQueen: 'La Salve',
                litanyOfLoreto: 'Letanía de Loreto',
                underYourProtection: 'Bajo tu Amparo',
                finalPrayer: 'Oración Final',
                completed: '¡Has completado el Santo Rosario!',
                completedTitle: 'Completado'
            };
        }

        return {
            signOfCross: 'Sign of the Cross',
            openingInvocation: 'Opening Invocation',
            actOfContrition: 'Act of Contrition',
            apostlesCreed: "Apostles' Creed",
            invocationHolySpirit: 'Invocation to the Holy Spirit',
            intentions: 'Moment of Intentions',
            mystery: 'Mystery',
            mysteryOrdinal: '',
            ourFather: 'Our Father',
            hailMary: 'Hail Mary',
            gloryBe: 'Glory Be',
            jaculatory: 'Jaculatory Prayer',
            fatimaPrayer: 'Fatima Prayer',
            finalJaculatory: 'Final Jaculatory',
            hailHolyQueen: 'Hail Holy Queen',
            litanyOfLoreto: 'Litany of Loreto',
            underYourProtection: 'Under Your Protection',
            finalPrayer: 'Final Prayer',
            completed: 'You have completed the Holy Rosary!',
            completedTitle: 'Completed'
        };
    }

    getCurrentStep(): PrayerStep {
        return this.steps[this.currentStepIndex];
    }

    getNextStep(): PrayerStep | null {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.currentStepIndex++;
            return this.steps[this.currentStepIndex];
        }
        return null;
    }

    getPreviousStep(): PrayerStep | null {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            return this.steps[this.currentStepIndex];
        }
        return null;
    }

    getTotalSteps(): number {
        return this.steps.length;
    }

    getCurrentStepNumber(): number {
        return this.currentStepIndex + 1;
    }

    getProgress(): number {
        return (this.currentStepIndex / (this.steps.length - 1)) * 100;
    }

    isComplete(): boolean {
        return this.currentStepIndex === this.steps.length - 1;
    }

    isFirstStep(): boolean {
        return this.currentStepIndex === 0;
    }

    isLastStep(): boolean {
        return this.currentStepIndex === this.steps.length - 1;
    }

    getMysteryName(): string {
        return prayerData[this.language].mysteries_data[this.mysteryType].name;
    }

    // Jump to a specific step (useful for resuming sessions)
    jumpToStep(index: number): void {
        if (index >= 0 && index < this.steps.length) {
            this.currentStepIndex = index;
        }
    }

    // Get current decade info (if in a decade)
    getCurrentDecadeInfo(): {
        number: number;
        title: string;
        reflection: string;
        imageUrl?: string;
        fruit?: string;
        scripture?: { text: string; reference: string };
    } | null {
        const step = this.getCurrentStep();
        if (step.decadeNumber) {
            const decade = prayerData[this.language].mysteries_data[this.mysteryType].decades[step.decadeNumber - 1];

            // Find mystery details from mysterySets
            const mysterySet = mysterySets.find(s => s.type === this.mysteryType);
            const mystery = mysterySet?.mysteries.find(m => m.number === step.decadeNumber);

            const fruit = mystery?.fruit?.[this.language];
            const scripture = mystery?.scripture?.[this.language];

            return {
                number: step.decadeNumber,
                title: decade.title,
                reflection: decade.reflection,
                imageUrl: mystery?.imageUrl,
                fruit,
                scripture
            };
        }
        return null;
    }

    // Change language (rebuilds sequence)
    setLanguage(language: Language): void {
        const currentStepIndex = this.currentStepIndex;
        this.language = language;
        this.buildPrayerSequence();
        this.currentStepIndex = currentStepIndex;
    }
}
