import type { Language } from '../types';

export interface Devotion {
    id: string;
    title: Record<Language, string>;
    quote: Record<Language, string>;
    author: string;
    fullText: Record<Language, string>;
    date?: string;
}

export const dailyDevotions: Devotion[] = [
    {
        id: 'peace-1',
        title: {
            en: 'A Moment of Peace',
            es: 'Un Momento de Paz'
        },
        quote: {
            en: '"True holiness does not mean being superior to others; it means being crucified with Christ for them."',
            es: '"La verdadera santidad no significa ser superior a los demás; significa ser crucificado con Cristo por ellos."'
        },
        author: 'St. Josemaría Escrivá',
        fullText: {
            en: '"True holiness does not mean being superior to others; it means being crucified with Christ for them." - St. Josemaría Escrivá. Let this reflection guide your day, finding peace in service and humility. True devotion is found not in grand gestures, but in the quiet moments of sacrifice and love for others. As we pray the Rosary today, let us remember that each Hail Mary is an opportunity to unite ourselves more closely with Christ\'s mission of love and redemption.',
            es: '"La verdadera santidad no significa ser superior a los demás; significa ser crucificado con Cristo por ellos." - San Josemaría Escrivá. Que esta reflexión guíe tu día, encontrando paz en el servicio y la humildad. La verdadera devoción no se encuentra en grandes gestos, sino en los momentos tranquilos de sacrificio y amor por los demás. Al rezar el Rosario hoy, recordemos que cada Ave María es una oportunidad para unirnos más estrechamente a la misión de amor y redención de Cristo.'
        }
    },
    {
        id: 'faith-1',
        title: {
            en: 'Walking in Faith',
            es: 'Caminando en Fe'
        },
        quote: {
            en: '"Prayer is the raising of one\'s mind and heart to God or the requesting of good things from God."',
            es: '"La oración es la elevación de la mente y el corazón a Dios o la petición de cosas buenas a Dios."'
        },
        author: 'St. John Damascene',
        fullText: {
            en: '"Prayer is the raising of one\'s mind and heart to God or the requesting of good things from God." - St. John Damascene. Today, as you pray the Rosary, remember that each bead is a step closer to God. Let your prayers be sincere conversations with the Divine, trusting that He hears every word and knows every need of your heart.',
            es: '"La oración es la elevación de la mente y el corazón a Dios o la petición de cosas buenas a Dios." - San Juan Damasceno. Hoy, mientras rezas el Rosario, recuerda que cada cuenta es un paso más cerca de Dios. Deja que tus oraciones sean conversaciones sinceras con lo Divino, confiando en que Él escucha cada palabra y conoce cada necesidad de tu corazón.'
        }
    },
    {
        id: 'hope-1',
        title: {
            en: 'Hope in the Lord',
            es: 'Esperanza en el Señor'
        },
        quote: {
            en: '"The Rosary is the most beautiful and the most rich in graces of all prayers."',
            es: '"El Rosario es la más hermosa y la más rica en gracias de todas las oraciones."'
        },
        author: 'Pope Pius IX',
        fullText: {
            en: '"The Rosary is the most beautiful and the most rich in graces of all prayers." - Pope Pius IX. In times of uncertainty, the Rosary is our anchor of hope. Each mystery we contemplate reveals God\'s faithful love and His plan for our salvation. Let this prayer fill you with renewed hope and trust in Divine Providence.',
            es: '"El Rosario es la más hermosa y la más rica en gracias de todas las oraciones." - Papa Pío IX. En tiempos de incertidumbre, el Rosario es nuestra ancla de esperanza. Cada misterio que contemplamos revela el amor fiel de Dios y Su plan para nuestra salvación. Que esta oración te llene de esperanza renovada y confianza en la Divina Providencia.'
        }
    },
];

// Helper function to get today's devotion (can be randomized or date-based)
export function getTodaysDevotion(): Devotion {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return dailyDevotions[dayOfYear % dailyDevotions.length];
}
