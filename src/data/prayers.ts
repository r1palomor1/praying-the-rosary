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
            name: {
                en: 'Sign of the Cross',
                es: 'Señal de la Cruz'
            },
            text: {
                en: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',
                es: 'En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.'
            }
        },
        apostlesCreed: {
            name: {
                en: "Apostles' Creed",
                es: 'Credo de los Apóstoles'
            },
            text: {
                en: 'I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead. I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.',
                es: 'Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra. Creo en Jesucristo, su único Hijo, nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso. Desde allí ha de venir a juzgar a vivos y muertos. Creo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén.'
            }
        }
    },
    sequence: {
        ourFather: {
            name: {
                en: 'Our Father',
                es: 'Padre Nuestro'
            },
            text: {
                en: 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.',
                es: 'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.'
            }
        },
        hailMary: {
            name: {
                en: 'Hail Mary',
                es: 'Ave María'
            },
            text: {
                en: 'Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
                es: 'Dios te salve, María, llena eres de gracia, el Señor es contigo; bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.'
            }
        },
        gloryBe: {
            name: {
                en: 'Glory Be',
                es: 'Gloria'
            },
            text: {
                en: 'Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.',
                es: 'Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.'
            }
        },
        oMyJesus: {
            name: {
                en: 'O My Jesus (Fatima Prayer)',
                es: 'Oh Jesús Mío (Oración de Fátima)'
            },
            text: {
                en: 'O my Jesus, forgive us our sins, save us from the fires of hell, and lead all souls to Heaven, especially those in most need of Thy mercy. Amen.',
                es: 'Oh Jesús mío, perdónanos nuestros pecados, líbranos del fuego del infierno, lleva al cielo a todas las almas, especialmente a las más necesitadas de tu misericordia. Amén.'
            }
        }
    },
    closing: {
        hailHolyQueen: {
            name: {
                en: 'Hail Holy Queen',
                es: 'La Salve'
            },
            text: {
                en: 'Hail, Holy Queen, Mother of Mercy, our life, our sweetness and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary. Pray for us, O Holy Mother of God, that we may be made worthy of the promises of Christ. Amen.',
                es: 'Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A ti llamamos los desterrados hijos de Eva; a ti suspiramos, gimiendo y llorando en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro, muéstranos a Jesús, fruto bendito de tu vientre. Oh clementísima, oh piadosa, oh dulce Virgen María. Ruega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Amén.'
            }
        },
        litany: {
            name: {
                en: 'Litany of the Blessed Virgin Mary',
                es: 'Letanías de la Santísima Virgen María'
            },
            text: {
                en: `Lord, have mercy.
Christ, have mercy.
Lord, have mercy.
Christ, hear us.
Christ, graciously hear us.

God, the Father of Heaven, have mercy on us.
God, the Son, Redeemer of the world, have mercy on us.
God, the Holy Spirit, have mercy on us.
Holy Trinity, one God, have mercy on us.

Holy Mary, pray for us.
Holy Mother of God, pray for us.
Holy Virgin of virgins, pray for us.
Mother of Christ, pray for us.
Mother of the Church, pray for us.
Mother of Mercy, pray for us.
Mother of divine grace, pray for us.
Mother of Hope, pray for us.
Mother most pure, pray for us.
Mother most chaste, pray for us.
Mother inviolate, pray for us.
Mother undefiled, pray for us.
Mother most amiable, pray for us.
Mother most admirable, pray for us.
Mother of good counsel, pray for us.
Mother of our Creator, pray for us.
Mother of our Savior, pray for us.
Virgin most prudent, pray for us.
Virgin most venerable, pray for us.
Virgin most renowned, pray for us.
Virgin most powerful, pray for us.
Virgin most merciful, pray for us.
Virgin most faithful, pray for us.
Mirror of justice, pray for us.
Seat of wisdom, pray for us.
Cause of our joy, pray for us.
Spiritual vessel, pray for us.
Vessel of honor, pray for us.
Singular vessel of devotion, pray for us.
Mystical rose, pray for us.
Tower of David, pray for us.
Tower of ivory, pray for us.
House of gold, pray for us.
Ark of the covenant, pray for us.
Gate of heaven, pray for us.
Morning star, pray for us.
Health of the sick, pray for us.
Refuge of sinners, pray for us.
Comforter of the afflicted, pray for us.
Help of Christians, pray for us.
Queen of Angels, pray for us.
Queen of Patriarchs, pray for us.
Queen of Prophets, pray for us.
Queen of Apostles, pray for us.
Queen of Martyrs, pray for us.
Queen of Confessors, pray for us.
Queen of Virgins, pray for us.
Queen of all Saints, pray for us.
Queen conceived without original sin, pray for us.
Queen assumed into heaven, pray for us.
Queen of the most holy Rosary, pray for us.
Queen of the Family, pray for us.
Queen of Peace, pray for us.

Lamb of God, who takes away the sins of the world,
spare us, O Lord.
Lamb of God, who takes away the sins of the world,
graciously hear us, O Lord.
Lamb of God, who takes away the sins of the world,
have mercy on us.

Pray for us, O Holy Mother of God.
That we may be made worthy of the promises of Christ.

Let us pray.
Grant, we beseech You, O Lord God, that we, Your servants, may enjoy perpetual health of mind and body, and by the glorious intercession of the Blessed Mary, ever Virgin, be delivered from present sorrow and attain eternal joy. Through Christ our Lord. Amen.`,
                es: `Señor, ten piedad.
Cristo, ten piedad.
Señor, ten piedad.
Cristo, óyenos.
Cristo, escúchanos.

Dios, Padre celestial, ten piedad de nosotros.
Dios, Hijo, Redentor del mundo, ten piedad de nosotros.
Dios, Espíritu Santo, ten piedad de nosotros.
Santísima Trinidad, un solo Dios, ten piedad de nosotros.

Santa María, ruega por nosotros.
Santa Madre de Dios, ruega por nosotros.
Santa Virgen de las Vírgenes, ruega por nosotros.
Madre de Cristo, ruega por nosotros.
Madre de la Iglesia, ruega por nosotros.
Madre de la misericordia, ruega por nosotros.
Madre de la divina gracia, ruega por nosotros.
Madre de la Esperanza, ruega por nosotros.
Madre purísima, ruega por nosotros.
Madre castísima, ruega por nosotros.
Madre siempre virgen, ruega por nosotros.
Madre inmaculada, ruega por nosotros.
Madre amable, ruega por nosotros.
Madre admirable, ruega por nosotros.
Madre del buen consejo, ruega por nosotros.
Madre del Creador, ruega por nosotros.
Madre del Salvador, ruega por nosotros.
Virgen prudentísima, ruega por nosotros.
Virgen digna de veneración, ruega por nosotros.
Virgen digna de alabanza, ruega por nosotros.
Virgen poderosa, ruega por nosotros.
Virgen clemente, ruega por nosotros.
Virgen fiel, ruega por nosotros.
Espejo de justicia, ruega por nosotros.
Trono de la sabiduría, ruega por nosotros.
Causa de nuestra alegría, ruega por nosotros.
Vaso espiritual, ruega por nosotros.
Vaso digno de honor, ruega por nosotros.
Vaso insigne de devoción, ruega por nosotros.
Rosa mística, ruega por nosotros.
Torre de David, ruega por nosotros.
Torre de marfil, ruega por nosotros.
Casa de oro, ruega por nosotros.
Arca de la Alianza, ruega por nosotros.
Puerta del cielo, ruega por nosotros.
Estrella de la mañana, ruega por nosotros.
Salud de los enfermos, ruega por nosotros.
Refugio de los pecadores, ruega por nosotros.
Consuelo de los afligidos, ruega por nosotros.
Auxilio de los cristianos, ruega por nosotros.
Reina de los Ángeles, ruega por nosotros.
Reina de los Patriarcas, ruega por nosotros.
Reina de los Profetas, ruega por nosotros.
Reina de los Apóstoles, ruega por nosotros.
Reina de los Mártires, ruega por nosotros.
Reina de los Confesores, ruega por nosotros.
Reina de las Vírgenes, ruega por nosotros.
Reina de todos los Santos, ruega por nosotros.
Reina concebida sin pecado original, ruega por nosotros.
Reina asunta a los Cielos, ruega por nosotros.
Reina del Santísimo Rosario, ruega por nosotros.
Reina de la familia, ruega por nosotros.
Reina de la Paz, ruega por nosotros.

Cordero de Dios, que quitas el pecado del mundo,
Perdónanos, Señor.
Cordero de Dios, que quitas el pecado del mundo,
Escúchanos, Señor.
Cordero de Dios, que quitas el pecado del mundo,
Ten misericordia de nosotros.

Ruega por nosotros, Santa Madre de Dios.
Para que seamos dignos de alcanzar las promesas de Jesucristo.

Oremos.
Te rogamos nos concedas, Señor Dios nuestro, gozar de continua salud de alma y cuerpo, y por la gloriosa intercesión de la bienaventurada siempre Virgen María, vernos libres de las tristezas de la vida presente y disfrutar de las alegrías eternas. Por Cristo nuestro Señor. Amén.`
            }
        },
        finalPrayer: {
            name: {
                en: 'Final Prayer',
                es: 'Oración Final'
            },
            text: {
                en: 'O God, whose only begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech Thee, that meditating upon these mysteries of the Most Holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.',
                es: 'Oh Dios, cuyo Hijo Unigénito, por su vida, muerte y resurrección, nos ha merecido el premio de la vida eterna, concédenos, te rogamos, que meditando estos misterios del Santísimo Rosario de la Bienaventurada Virgen María, imitemos lo que contienen y alcancemos lo que prometen. Por el mismo Cristo nuestro Señor. Amén.'
            }
        },
        sacredFinalPrayer: {
            name: {
                en: 'Final Prayer',
                es: 'Oración Final'
            },
            text: {
                en: 'O God, whose only begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech Thee, that meditating upon these prayers, we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.',
                es: 'Oh Dios, cuyo Hijo Unigénito, por su vida, muerte y resurrección, nos ha merecido el premio de la vida eterna, concédenos, te rogamos, que meditando estas oraciones, imitemos lo que contienen y alcancemos lo que prometen. Por el mismo Cristo nuestro Señor. Amén.'
            }
        },
        signOfTheCross: {
            name: {
                en: 'Sign of the Cross',
                es: 'Señal de la Cruz'
            },
            text: {
                en: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',
                es: 'En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.'
            }
        }
    }
};
