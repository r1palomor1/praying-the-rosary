import { prayerData, type Language } from '../data/prayerData';

export type SacredPrayerStepType =
    | 'sign_of_cross_start'
    | 'opening_invocation'
    | 'act_of_contrition'
    | 'apostles_creed'
    | 'invocation_holy_spirit'
    | 'our_father'
    | 'hail_mary'
    | 'glory_be'
    | 'jaculatory'
    | 'fatima_prayer'
    | 'final_jaculatory_start'
    | 'final_hail_mary_intro' // 4 iterations
    | 'hail_holy_queen'
    | 'closing_under_your_protection'
    | 'final_collect'
    | 'sign_of_cross_end'
    | 'complete';

export interface SacredPrayerStep {
    type: SacredPrayerStepType;
    text: string;
    title?: string;
    imageUrl?: string;
    finalHailMaryNumber?: number; // 1-4
}

export class SacredPrayerFlowEngine {
    private language: Language;
    private currentStepIndex: number = 0;
    private steps: SacredPrayerStep[] = [];

    constructor(language: Language = 'en') {
        this.language = language;
        this.buildPrayerSequence();
    }

    private buildPrayerSequence(): void {
        const data = prayerData[this.language];
        const { fixed_prayers } = data;
        this.steps = [];

        const t = this.getTranslations();

        // Standard images
        const introPrayerImage = '/images/intro-prayers.webp';
        const closingPrayerImage = '/images/closing-prayers.webp';

        // --- 1. Sign of the Cross ---
        this.steps.push({
            type: 'sign_of_cross_start',
            text: fixed_prayers.sign_of_cross_start,
            title: t.signOfCross,
            imageUrl: introPrayerImage
        });

        // --- 2. Opening Invocation ---
        this.steps.push({
            type: 'opening_invocation',
            text: fixed_prayers.opening_invocation,
            title: t.openingInvocation,
            imageUrl: introPrayerImage
        });

        // --- 3. Invocation to the Holy Spirit ---
        this.steps.push({
            type: 'invocation_holy_spirit',
            text: fixed_prayers.invocation_holy_spirit,
            title: t.invocationHolySpirit,
            imageUrl: introPrayerImage
        });

        // --- 4. Apostles' Creed ---
        this.steps.push({
            type: 'apostles_creed',
            text: fixed_prayers.apostles_creed,
            title: t.apostlesCreed,
            imageUrl: introPrayerImage
        });

        // --- 5. Our Father ---
        this.steps.push({
            type: 'our_father',
            text: fixed_prayers.decade_our_father,
            title: t.ourFather,
            imageUrl: introPrayerImage
        });

        // --- 6. Hail Mary ---
        this.steps.push({
            type: 'hail_mary',
            text: fixed_prayers.decade_hail_mary,
            title: t.hailMary,
            imageUrl: introPrayerImage
        });

        // --- 7. Glory Be ---
        this.steps.push({
            type: 'glory_be',
            text: fixed_prayers.decade_glory_be,
            title: t.gloryBe,
            imageUrl: introPrayerImage
        });

        // --- 8. Jaculatory Prayer ---
        this.steps.push({
            type: 'jaculatory',
            text: fixed_prayers.decade_jaculatory,
            title: t.jaculatory,
            imageUrl: introPrayerImage
        });

        // --- 9. Act of Contrition ---
        this.steps.push({
            type: 'act_of_contrition',
            text: fixed_prayers.act_of_contrition,
            title: t.actOfContrition,
            imageUrl: introPrayerImage
        });

        // --- 10. Hail Holy Queen ---
        this.steps.push({
            type: 'hail_holy_queen',
            text: fixed_prayers.hail_holy_queen,
            title: t.hailHolyQueen,
            imageUrl: closingPrayerImage
        });

        // --- 11. Final Prayer ---
        this.steps.push({
            type: 'final_collect',
            text: fixed_prayers.sacred_final_collect,
            title: t.finalPrayer,
            imageUrl: closingPrayerImage
        });

        // --- 12. Closing Sign of the Cross ---
        this.steps.push({
            type: 'sign_of_cross_end',
            text: fixed_prayers.sign_of_cross_end,
            title: t.signOfCross,
            imageUrl: closingPrayerImage
        });

        // --- 13. Completion ---
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
                ourFather: 'Padre Nuestro',
                hailMary: 'Ave María',
                gloryBe: 'Gloria',
                jaculatory: 'Jaculatoria',
                fatimaPrayer: 'Oración de Fátima',
                finalJaculatory: 'Jaculatoria Final',
                hailHolyQueen: 'La Salve',
                underYourProtection: 'Bajo tu Amparo',
                finalPrayer: 'Oración Final',
                completed: '¡Has completado las Oraciones Sagradas!',
                completedTitle: 'Completado'
            };
        }

        return {
            signOfCross: 'Sign of the Cross',
            openingInvocation: 'Opening Invocation',
            actOfContrition: 'Act of Contrition',
            apostlesCreed: "Apostles' Creed",
            invocationHolySpirit: 'Invocation to the Holy Spirit',
            ourFather: 'Our Father',
            hailMary: 'Hail Mary',
            gloryBe: 'Glory Be',
            jaculatory: 'Jaculatory Prayer',
            fatimaPrayer: 'Fatima Prayer',
            finalJaculatory: 'Final Jaculatory',
            hailHolyQueen: 'Hail Holy Queen',
            underYourProtection: 'Under Your Protection',
            finalPrayer: 'Final Prayer',
            completed: 'You have completed the Sacred Prayers!',
            completedTitle: 'Completed'
        };
    }

    getCurrentStep(): SacredPrayerStep {
        return this.steps[this.currentStepIndex];
    }

    getNextStep(): SacredPrayerStep | null {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.currentStepIndex++;
            return this.steps[this.currentStepIndex];
        }
        return null;
    }

    getPreviousStep(): SacredPrayerStep | null {
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

    setLanguage(language: Language): void {
        const currentStepIndex = this.currentStepIndex;
        this.language = language;
        this.buildPrayerSequence();
        this.currentStepIndex = currentStepIndex;
    }

    jumpToStep(index: number): void {
        if (index >= 0 && index < this.steps.length) {
            this.currentStepIndex = index;
        }
    }

    isFirstStep(): boolean {
        return this.currentStepIndex === 0;
    }

    isLastStep(): boolean {
        return this.currentStepIndex === this.steps.length - 1;
    }

    getMysteryName(): string {
        return this.language === 'es' ? 'Oraciones Sagradas' : 'Sacred Prayers';
    }

    getCurrentDecadeInfo(): any | null {
        return null; // Sacred Prayers acts like a linear sequence without decades
    }
}
