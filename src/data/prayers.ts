import type { Prayer, PrayerSequence, ClosingPrayers } from '../types';

export const prayers: {
    sequence: PrayerSequence;
    closing: ClosingPrayers;
    opening: {
        signOfTheCross: Prayer;
        apostlesCreed: Prayer;
    };
} = {
    opening: {
        signOfTheCross: {
            name: 'Sign of the Cross',
            text: {
                en: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',
                es: 'En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.'
            }
        },
        apostlesCreed: {
            name: "Apostles' Creed",
            text: {
                en: 'I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead. I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.',
                es: 'Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra. Creo en Jesucristo, su único Hijo, nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso. Desde allí ha de venir a juzgar a vivos y muertos. Creo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén.'
            }
        }
    },
    sequence: {
        ourFather: {
            name: 'Our Father',
            text: {
                en: 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.',
                es: 'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.'
            }
        },
        hailMary: {
            name: 'Hail Mary',
            text: {
                en: 'Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
                es: 'Dios te salve, María, llena eres de gracia, el Señor es contigo; bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.'
            }
        },
        gloryBe: {
            name: 'Glory Be',
            text: {
                en: 'Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.',
                es: 'Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.'
            }
        },
        oMyJesus: {
            name: 'O My Jesus (Fatima Prayer)',
            text: {
                en: 'O my Jesus, forgive us our sins, save us from the fires of hell, and lead all souls to Heaven, especially those in most need of Thy mercy. Amen.',
                es: 'Oh Jesús mío, perdónanos nuestros pecados, líbranos del fuego del infierno, lleva al cielo a todas las almas, especialmente a las más necesitadas de tu misericordia. Amén.'
            }
        }
    },
    closing: {
        hailHolyQueen: {
            name: 'Hail Holy Queen',
            text: {
                en: 'Hail, Holy Queen, Mother of Mercy, our life, our sweetness and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary. Pray for us, O Holy Mother of God, that we may be made worthy of the promises of Christ. Amen.',
                es: 'Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A ti llamamos los desterrados hijos de Eva; a ti suspiramos, gimiendo y llorando en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro, muéstranos a Jesús, fruto bendito de tu vientre. Oh clementísima, oh piadosa, oh dulce Virgen María. Ruega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Amén.'
            }
        },
        finalPrayer: {
            name: 'Final Prayer',
            text: {
                en: 'O God, whose only begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech Thee, that meditating upon these mysteries of the Most Holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.',
                es: 'Oh Dios, cuyo Hijo Unigénito, por su vida, muerte y resurrección, nos ha merecido el premio de la vida eterna, concédenos, te rogamos, que meditando estos misterios del Santísimo Rosario de la Bienaventurada Virgen María, imitemos lo que contienen y alcancemos lo que prometen. Por el mismo Cristo nuestro Señor. Amén.'
            }
        },
        signOfTheCross: {
            name: 'Sign of the Cross',
            text: {
                en: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',
                es: 'En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.'
            }
        }
    }
};
