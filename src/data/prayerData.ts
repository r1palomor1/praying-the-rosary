// Complete bilingual prayer data structure for the Praying the Rosary application
// Supports both English and Spanish with complete prayer texts

export interface CallResponse {
    call: string;
    response: string;
}

export interface FinalHailMaryIntro {
    invocation: string;
    prayer?: string;
}

export interface LitanyOfLoreto {
    initial_petitions: CallResponse[];
    trinity_invocations: CallResponse[];
    mary_invocations: CallResponse[];
    agnus_dei: CallResponse[];
}

export interface FixedPrayers {
    sign_of_cross_start: string;
    opening_invocation: string;
    act_of_contrition: string;
    apostles_creed: string;
    invocation_holy_spirit: string;
    intention_placeholder: string;
    decade_our_father: string;
    decade_hail_mary: string;
    decade_glory_be: string;
    decade_jaculatory: string;
    fatima_prayer: string;
    final_jaculatory_start: string;
    final_hail_marys_intro: FinalHailMaryIntro[];
    hail_holy_queen: string;
    litany_of_loreto: LitanyOfLoreto;
    closing_under_your_protection: string;
    final_collect: string;
    sign_of_cross_end: string;
}

export interface Decade {
    number: number;
    title: string;
    reflection: string;
}

export interface MysteryData {
    name: string;
    days: string[];
    decades: Decade[];
}

export interface MysteriesData {
    joyful: MysteryData;
    luminous: MysteryData;
    sorrowful: MysteryData;
    glorious: MysteryData;
}

export interface PrayerDataStructure {
    fixed_prayers: FixedPrayers;
    mysteries_data: MysteriesData;
}

export type Language = 'en' | 'es';

export const prayerData: Record<Language, PrayerDataStructure> = {
    en: {
        fixed_prayers: {
            sign_of_cross_start: "By the sign of the Holy Cross, from our enemies, deliver us, O Lord, our God. In the name of the Father, and of the Son, and of the Holy Spirit. Amen.",
            opening_invocation: "O Lord, open my lips, and my mouth shall proclaim your praise.",
            act_of_contrition: "O my God, I am heartily sorry for having offended Thee, and I detest all my sins because of Thy just punishments, but most of all because they offend Thee, my God, Who art all good and deserving of all my love. I firmly resolve with the help of Thy grace, to confess my sins, to do penance, and to amend my life. Amen.",
            apostles_creed: "I believe in God, the Father Almighty, Creator of heaven and earth; and in Jesus Christ, His only Son, our Lord; Who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried. He descended into hell; the third day He arose again from the dead; He ascended into heaven, sits at the right hand of God, the Father Almighty; from thence He shall come to judge the living and the dead. I believe in the Holy Spirit, the Holy Catholic Church, the communion of Saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.",
            invocation_holy_spirit: "Come, Holy Spirit, fill the hearts of your faithful and kindle in them the fire of your love. Send forth your Spirit and they shall be created, and you shall renew the face of the earth.",
            intention_placeholder: "It is time to lift up our hearts in prayer. It is the moment to leave your intentions to pray together for all needs and those of our families.",
            decade_our_father: "Our Father, Who art in Heaven, hallowed be Thy Name. Thy Kingdom come. Thy Will be done, on earth as it is in Heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us, and lead us not into temptation, but deliver us from evil. Amen.",
            decade_hail_mary: "Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
            decade_glory_be: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
            decade_jaculatory: "O Mary, Mother of grace and Mother of mercy, defend us from the enemy, and receive us at the hour of our death. Amen.",
            fatima_prayer: "O My Jesus, forgive us our sins, save us from the fires of hell, lead all souls to Heaven, especially those in most need of Thy mercy. Amen.",
            final_jaculatory_start: "O Sovereign Sanctuary, Tabernacle of the Eternal Word! O Virgin, deliver us from Hell, those of us who pray your Holy Rosary! O powerful Empress, Consolation of mortals! O Virgin, open Heaven to us with a happy death! Grant us purity of soul, O you who are so powerful.",
            final_hail_marys_intro: [
                {
                    invocation: "Hail, Most Holy Mary, Daughter of God the Father, Virgin most pure and chaste before birth; into your hands we commend our Faith, that you may enlighten it. Full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus.",
                    prayer: "Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen."
                },
                {
                    invocation: "Hail, Most Holy Mary, Mother of God the Son, Virgin most pure and chaste at birth; into your hands we commend our Hope, that you may encourage it. Full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus.",
                    prayer: "Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen."
                },
                {
                    invocation: "Hail, Most Holy Mary, Spouse of the Holy Spirit, Virgin most pure and chaste after birth; into your hands we commend our Charity, that you may inflame it. Full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus.",
                    prayer: "Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen."
                },
                {
                    invocation: "Hail, Most Holy Mary, Temple, Throne, and Tabernacle of the Most Holy Trinity, Virgin conceived without original sin."
                }
            ],
            hail_holy_queen: "Hail, Holy Queen, Mother of Mercy, our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary. Pray for us, O holy Mother of God, that we may be made worthy of the promises of Christ. Amen.",
            litany_of_loreto: {
                initial_petitions: [
                    { call: "Lord, have mercy.", response: "Lord, have mercy." },
                    { call: "Christ, have mercy.", response: "Christ, have mercy." },
                    { call: "Lord, have mercy.", response: "Lord, have mercy." },
                    { call: "Christ, hear us.", response: "Christ, hear us." },
                    { call: "Christ, graciously hear us.", response: "Christ, graciously hear us." }
                ],
                trinity_invocations: [
                    { call: "God, the Father of Heaven,", response: "Have mercy on us." },
                    { call: "God, the Son, Redeemer of the world,", response: "Have mercy on us." },
                    { call: "God, the Holy Spirit,", response: "Have mercy on us." },
                    { call: "Holy Trinity, one God,", response: "Have mercy on us." }
                ],
                mary_invocations: [
                    { call: "Holy Mary,", response: "Pray for us." },
                    { call: "Holy Mother of God,", response: "Pray for us." },
                    { call: "Holy Virgin of virgins,", response: "Pray for us." },
                    { call: "Mother of Christ,", response: "Pray for us." },
                    { call: "Mother of divine grace,", response: "Pray for us." },
                    { call: "Mother most pure,", response: "Pray for us." },
                    { call: "Mother most chaste,", response: "Pray for us." },
                    { call: "Mother inviolate,", response: "Pray for us." },
                    { call: "Mother undefiled,", response: "Pray for us." },
                    { call: "Mother most amiable,", response: "Pray for us." },
                    { call: "Mother most admirable,", response: "Pray for us." },
                    { call: "Mother of good counsel,", response: "Pray for us." },
                    { call: "Mother of our Creator,", response: "Pray for us." },
                    { call: "Mother of our Savior,", response: "Pray for us." },
                    { call: "Mother of the Church,", response: "Pray for us." },
                    { call: "Virgin most prudent,", response: "Pray for us." },
                    { call: "Virgin most venerable,", response: "Pray for us." },
                    { call: "Virgin most renowned,", response: "Pray for us." },
                    { call: "Virgin most powerful,", response: "Pray for us." },
                    { call: "Virgin most merciful,", response: "Pray for us." },
                    { call: "Virgin most faithful,", response: "Pray for us." },
                    { call: "Mirror of justice,", response: "Pray for us." },
                    { call: "Seat of wisdom,", response: "Pray for us." },
                    { call: "Cause of our joy,", response: "Pray for us." },
                    { call: "Spiritual vessel,", response: "Pray for us." },
                    { call: "Vessel of honor,", response: "Pray for us." },
                    { call: "Singular vessel of devotion,", response: "Pray for us." },
                    { call: "Mystical rose,", response: "Pray for us." },
                    { call: "Tower of David,", response: "Pray for us." },
                    { call: "Tower of ivory,", response: "Pray for us." },
                    { call: "House of gold,", response: "Pray for us." },
                    { call: "Ark of the covenant,", response: "Pray for us." },
                    { call: "Gate of Heaven,", response: "Pray for us." },
                    { call: "Morning star,", response: "Pray for us." },
                    { call: "Health of the sick,", response: "Pray for us." },
                    { call: "Refuge of sinners,", response: "Pray for us." },
                    { call: "Comforter of the afflicted,", response: "Pray for us." },
                    { call: "Help of Christians,", response: "Pray for us." },
                    { call: "Queen of Angels,", response: "Pray for us." },
                    { call: "Queen of Patriarchs,", response: "Pray for us." },
                    { call: "Queen of Prophets,", response: "Pray for us." },
                    { call: "Queen of Apostles,", response: "Pray for us." },
                    { call: "Queen of Martyrs,", response: "Pray for us." },
                    { call: "Queen of Confessors,", response: "Pray for us." },
                    { call: "Queen of Virgins,", response: "Pray for us." },
                    { call: "Queen of all Saints,", response: "Pray for us." },
                    { call: "Queen conceived without original sin,", response: "Pray for us." },
                    { call: "Queen assumed into Heaven,", response: "Pray for us." },
                    { call: "Queen of the most Holy Rosary,", response: "Pray for us." },
                    { call: "Queen of families,", response: "Pray for us." },
                    { call: "Queen of peace,", response: "Pray for us." }
                ],
                agnus_dei: [
                    { call: "Lamb of God, who takest away the sins of the world,", response: "Spare us, O Lord." },
                    { call: "Lamb of God, who takest away the sins of the world,", response: "Graciously hear us, O Lord." },
                    { call: "Lamb of God, who takest away the sins of the world,", response: "Have mercy on us." }
                ]
            },
            closing_under_your_protection: "We fly to your patronage, O holy Mother of God; despise not our petitions in our necessities, but ever deliver us from all dangers, O glorious and blessed Virgin. Pray for us, O Holy Mother of God, that we may be made worthy of the promises and divine grace of our Lord Jesus Christ. Amen.",
            final_collect: "O God, whose only begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech Thee, that meditating upon these mysteries of the Most Holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.",
            sign_of_cross_end: "In the name of the Father, and of the Son, and of the Holy Spirit. Amen."
        },
        mysteries_data: {
            joyful: {
                name: "The Joyful Mysteries",
                days: ["Monday", "Saturday"],
                decades: [
                    {
                        number: 1,
                        title: "The Annunciation",
                        reflection: "The angel said to her, \"Do not be afraid, Mary, for you have found favor with God. You will conceive in your womb and bear a son, and you shall name him Jesus.\""
                    },
                    {
                        number: 2,
                        title: "The Visitation",
                        reflection: "And Elizabeth greeted her, saying, \"Blessed is she who believed that there would be a fulfillment of what was spoken to her from the Lord.\""
                    },
                    {
                        number: 3,
                        title: "The Nativity",
                        reflection: "And she gave birth to her firstborn son and wrapped him in swaddling clothes and laid him in a manger, because there was no place for them in the inn."
                    },
                    {
                        number: 4,
                        title: "The Presentation of Jesus in the Temple",
                        reflection: "When the days were completed for their purification according to the law of Moses, they took him up to Jerusalem to present him to the Lord."
                    },
                    {
                        number: 5,
                        title: "The Finding of Jesus in the Temple",
                        reflection: "And it happened that after three days they found him in the temple, sitting in the midst of the teachers, listening to them and asking them questions."
                    }
                ]
            },
            luminous: {
                name: "The Luminous Mysteries",
                days: ["Thursday"],
                decades: [
                    {
                        number: 1,
                        title: "The Baptism of Jesus in the Jordan",
                        reflection: "The Holy Spirit descended upon him in bodily form like a dove. And a voice came from heaven, \"You are my beloved Son; with you I am well pleased.\""
                    },
                    {
                        number: 2,
                        title: "The Wedding at Cana",
                        reflection: "When the wine ran short, the mother of Jesus said to him, \"They have no wine.\" Jesus said to her, \"Woman, how does your concern affect me? My hour has not yet come.\" His mother told the servers, \"Do whatever he tells you.\""
                    },
                    {
                        number: 3,
                        title: "The Proclamation of the Kingdom of God",
                        reflection: "From that time on, Jesus began to preach and say, \"Repent, for the kingdom of heaven is at hand.\""
                    },
                    {
                        number: 4,
                        title: "The Transfiguration",
                        reflection: "And He was transfigured before them; His face shone like the sun, and His clothes became as white as the light."
                    },
                    {
                        number: 5,
                        title: "The Institution of the Eucharist",
                        reflection: "While they were eating, He took bread, blessed and broke it, and gave it to them and said, \"Take, this is my body.\""
                    }
                ]
            },
            sorrowful: {
                name: "The Sorrowful Mysteries",
                days: ["Tuesday", "Friday"],
                decades: [
                    {
                        number: 1,
                        title: "The Agony in the Garden",
                        reflection: "Father, if you are willing, take this cup away from me; still, not my will but yours be done."
                    },
                    {
                        number: 2,
                        title: "The Scourging at the Pillar",
                        reflection: "Look, we are going up to Jerusalem, and everything that is written by the prophets about the Son of Man will be fulfilled. For he will be handed over to the Gentiles and will be mocked, insulted, and spit upon; and after they have scourged him, they will kill him, but on the third day he will rise again."
                    },
                    {
                        number: 3,
                        title: "The Crowning with Thorns",
                        reflection: "And the soldiers wove a crown out of thorns and placed it on his head, and clothed him in a purple cloak, and they came to him and said, \"Hail, King of the Jews!\" And they struck him with their hands."
                    },
                    {
                        number: 4,
                        title: "The Carrying of the Cross",
                        reflection: "They compelled a passerby, Simon, a Cyrenian, who was coming in from the country, the father of Alexander and Rufus, to take up his cross."
                    },
                    {
                        number: 5,
                        title: "The Crucifixion",
                        reflection: "No one has greater love than this, to lay down one's life for one's friends."
                    }
                ]
            },
            glorious: {
                name: "The Glorious Mysteries",
                days: ["Wednesday", "Sunday"],
                decades: [
                    {
                        number: 1,
                        title: "The Resurrection",
                        reflection: "Thomas answered and said to him, \"My Lord and my God!\" Jesus said to him, \"Have you come to believe because you have seen me? Blessed are those who have not seen and have believed.\""
                    },
                    {
                        number: 2,
                        title: "The Ascension",
                        reflection: "As he blessed them he parted from them and was taken up to heaven. They did him homage and returned to Jerusalem with great joy."
                    },
                    {
                        number: 3,
                        title: "The Descent of the Holy Spirit",
                        reflection: "And there appeared to them tongues as of fire, distributing themselves, and rested on each one of them."
                    },
                    {
                        number: 4,
                        title: "The Assumption of Mary",
                        reflection: "A woman in the crowd raised her voice and said to him, \"Blessed is the womb that carried you and the breasts at which you nursed.\" He replied, \"Rather, blessed are those who hear the word of God and observe it.\""
                    },
                    {
                        number: 5,
                        title: "The Coronation of Mary",
                        reflection: "From now on all generations will call me blessed; for the Mighty One has done great things for me."
                    }
                ]
            }
        }
    },
    es: {
        fixed_prayers: {
            sign_of_cross_start: "Por la señal de la Santa Cruz, de nuestros enemigos, líbranos, Señor, Dios nuestro. En el nombre del Padre, del Hijo y del Espíritu Santo. Amén.",
            opening_invocation: "Abre, Señor, mis labios, y mi boca proclamará tu alabanza.",
            act_of_contrition: "Señor mío Jesucristo, Dios y hombre verdadero, Creador y Redentor mío, por ser Tú quien eres y porque te amo sobre todas las cosas, me pesa de todo corazón haberte ofendido. Quiero y propongo firmemente confesarme a su tiempo, ofrezco mi vida, obras y trabajos en satisfacción de mis pecados y confío en que tu bondad y misericordia infinita me los perdonarás y me darás la gracia para no volverte a ofender. Amén.",
            apostles_creed: "Creo en Dios, Padre Todopoderoso, Creador del cielo y de la tierra. Creo en Jesucristo, su único Hijo, Nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios Padre Todopoderoso. Desde allí ha de venir a juzgar a los vivos y a los muertos. Creo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén.",
            invocation_holy_spirit: "Ven, Espíritu Santo, llena los corazones de tus fieles y enciende en ellos el fuego de tu amor. Envía tu espíritu y renovarás la faz de la tierra.",
            intention_placeholder: "Es tiempo de elevar nuestros corazones en oración. Es el momento de dejar tus intenciones para orar juntos por todas las necesidades y las de nuestras familias.",
            decade_our_father: "Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.",
            decade_hail_mary: "Dios te salve, María, llena eres de gracia; el Señor es contigo; bendita Tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.",
            decade_glory_be: "Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.",
            decade_jaculatory: "María, madre de gracia y madre de misericordia, en la vida y en la muerte, ampáranos gran Señora.",
            fatima_prayer: "Oh Jesús mío, perdona nuestros pecados, líbranos del fuego del infierno, lleva al cielo a todas las almas y socorre especialmente a las más necesitadas de tu misericordia. Amén.",
            final_jaculatory_start: "¡Oh, Soberano Santuario, Sagrario del Verbo eterno! ¡Libra, Virgen, del Infierno, a los que rezamos tu Santo Rosario! ¡Emperatriz poderosa, de los mortales Consuelo! ¡Ábrenos, Virgen, el Cielo, con una muerte dichosa! Danos pureza de alma tú que eres tan poderosa.",
            final_hail_marys_intro: [
                {
                    invocation: "Dios te salve María Santísima, Hija de Dios Padre, Virgen purísima y castísima antes del parto; en tus manos encomendamos nuestra Fe, para que la alumbres. Llena eres de gracia; el Señor es contigo; bendita Tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús.",
                    prayer: "Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén."
                },
                {
                    invocation: "Dios te salve María Santísima, Madre de Dios Hijo, Virgen purísima y castísima en el parto; en tus manos encomendamos nuestra Esperanza, para que la alientes. Llena eres de gracia; el Señor es contigo; bendita Tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús.",
                    prayer: "Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén."
                },
                {
                    invocation: "Dios te salve, María Santísima, Esposa del Espíritu Santo, Virgen purísima y castísima después del parto; en tus manos encomendamos nuestra Caridad, para que la inflames. Llena eres de gracia; el Señor es contigo; bendita Tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús.",
                    prayer: "Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén."
                },
                {
                    invocation: "Dios te salve, María Santísima, templo, trono y sagrario de la Santisima Trinidad, Virgen concebida sin la culpa original."
                }
            ],
            hail_holy_queen: "Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra. Dios te salve. A ti clamamos los desterrados hijos de Eva, a ti suspiramos, gimiendo y llorando, en este valle de lágrimas. ¡Ea, pues, Señora, Abogada nuestra!, vuelve a nosotros esos tus ojos misericordiosos, y después de este destierro, muéstranos a Jesús, fruto bendito de tu vientre. ¡Oh, clemente, oh piadosa, oh dulce Virgen María! Ruega por nosotros Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo. Amén.",
            litany_of_loreto: {
                initial_petitions: [
                    { call: "Señor, ten piedad.", response: "Señor, ten piedad." },
                    { call: "Cristo, ten piedad.", response: "Cristo, ten piedad." },
                    { call: "Señor, ten piedad.", response: "Señor, ten piedad." },
                    { call: "Cristo, óyenos.", response: "Cristo, óyenos." },
                    { call: "Cristo, escúchanos.", response: "Cristo, escúchanos." }
                ],
                trinity_invocations: [
                    { call: "Dios Padre celestial,", response: "Ten misericordia de nosotros." },
                    { call: "Dios Hijo, Redentor del mundo,", response: "Ten misericordia de nosotros." },
                    { call: "Dios Espíritu Santo,", response: "Ten misericordia de nosotros." },
                    { call: "Trinidad Santa, un solo Dios,", response: "Ten misericordia de nosotros." }
                ],
                mary_invocations: [
                    { call: "Santa María,", response: "Ruega por nosotros." },
                    { call: "Santa Madre de Dios,", response: "Ruega por nosotros." },
                    { call: "Santa Virgen de las vírgenes,", response: "Ruega por nosotros." },
                    { call: "Madre de Cristo,", response: "Ruega por nosotros." },
                    { call: "Madre de la Divina Gracia,", response: "Ruega por nosotros." },
                    { call: "Madre purísima,", response: "Ruega por nosotros." },
                    { call: "Madre castísima,", response: "Ruega por nosotros." },
                    { call: "Madre virginal,", response: "Ruega por nosotros." },
                    { call: "Madre sin corrupción,", response: "Ruega por nosotros." },
                    { call: "Madre inmaculada,", response: "Ruega por nosotros." },
                    { call: "Madre amable,", response: "Ruega por nosotros." },
                    { call: "Madre admirable,", response: "Ruega por nosotros." },
                    { call: "Madre del buen consejo,", response: "Ruega por nosotros." },
                    { call: "Madre del Creador,", response: "Ruega por nosotros." },
                    { call: "Madre del Salvador,", response: "Ruega por nosotros." },
                    { call: "Madre de la Iglesia,", response: "Ruega por nosotros." },
                    { call: "Virgen prudentísima,", response: "Ruega por nosotros." },
                    { call: "Virgen digna de veneración,", response: "Ruega por nosotros." },
                    { call: "Virgen digna de alabanza,", response: "Ruega por nosotros." },
                    { call: "Virgen poderosa,", response: "Ruega por nosotros." },
                    { call: "Virgen clemente,", response: "Ruega por nosotros." },
                    { call: "Virgen fiel,", response: "Ruega por nosotros." },
                    { call: "Espejo de justicia,", response: "Ruega por nosotros." },
                    { call: "Trono de sabiduría,", response: "Ruega por nosotros." },
                    { call: "Causa de nuestra alegría,", response: "Ruega por nosotros." },
                    { call: "Vaso espiritual,", response: "Ruega por nosotros." },
                    { call: "Vaso digno de honor,", response: "Ruega por nosotros." },
                    { call: "Vaso insigne de devoción,", response: "Ruega por nosotros." },
                    { call: "Rosa mística,", response: "Ruega por nosotros." },
                    { call: "Torre de David,", response: "Ruega por nosotros." },
                    { call: "Torre de marfil,", response: "Ruega por nosotros." },
                    { call: "Casa de oro,", response: "Ruega por nosotros." },
                    { call: "Arca de la alianza,", response: "Ruega por nosotros." },
                    { call: "Puerta del cielo,", response: "Ruega por nosotros." },
                    { call: "Estrella de la mañana,", response: "Ruega por nosotros." },
                    { call: "Salud de los enfermos,", response: "Ruega por nosotros." },
                    { call: "Refugio de los pecadores,", response: "Ruega por nosotros." },
                    { call: "Consuelo de los afligidos,", response: "Ruega por nosotros." },
                    { call: "Auxilio de los cristianos,", response: "Ruega por nosotros." },
                    { call: "Reina de los ángeles,", response: "Ruega por nosotros." },
                    { call: "Reina de los patriarcas,", response: "Ruega por nosotros." },
                    { call: "Reina de los profetas,", response: "Ruega por nosotros." },
                    { call: "Reina de los apóstoles,", response: "Ruega por nosotros." },
                    { call: "Reina de los mártires,", response: "Ruega por nosotros." },
                    { call: "Reina de los confesores,", response: "Ruega por nosotros." },
                    { call: "Reina de las vírgenes,", response: "Ruega por nosotros." },
                    { call: "Reina de todos los santos,", response: "Ruega por nosotros." },
                    { call: "Reina concebida sin pecado original,", response: "Ruega por nosotros." },
                    { call: "Reina elevada al cielo,", response: "Ruega por nosotros." },
                    { call: "Reina del Santo Rosario,", response: "Ruega por nosotros." },
                    { call: "Reina de la familia,", response: "Ruega por nosotros." },
                    { call: "Reina de la paz,", response: "Ruega por nosotros." }
                ],
                agnus_dei: [
                    { call: "Cordero de Dios, que quitas el pecado del mundo,", response: "Perdónanos, Señor." },
                    { call: "Cordero de Dios, que quitas el pecado del mundo,", response: "Escúchanos, Señor." },
                    { call: "Cordero de Dios, que quitas el pecado del mundo,", response: "Ten misericordia de nosotros." }
                ]
            },
            closing_under_your_protection: "Bajo tu amparo nos acogemos, Santa Madre de Dios; no desprecies nuestras súplicas que dirigimos ante nuestras necesidades, antes bien, líbranos de todo peligro, ¡Oh, Virgen Gloriosa y Bendita! Ruega por nosotros Santa Madre de Dios, para que seamos dignos de alcanzar las promesas y divinas gracias de nuestro Señor Jesucristo. Amén.",
            final_collect: "Oh Dios, cuyo Unigénito Hijo, con su vida, muerte y resurrección, nos alcanzó el premio de la vida eterna, concédenos a los que recordamos estos Misterios del Santo Rosario, imitar lo que contienen y alcanzar lo que prometen, por el mismo Jesucristo Nuestro Señor. Amén.",
            sign_of_cross_end: "En el nombre del Padre, del Hijo y del Espíritu Santo. Amén."
        },
        mysteries_data: {
            joyful: {
                name: "Misterios Gozosos",
                days: ["Lunes", "Sábado"],
                decades: [
                    {
                        number: 1,
                        title: "La Encarnación del Hijo de Dios",
                        reflection: "El ángel le dijo: \"No temas María porque has encontrado gracia ante Dios, concebirás en tu vientre y darás a luz un hijo y le pondrás por nombre Jesús.\""
                    },
                    {
                        number: 2,
                        title: "La Visitación de María a su prima Santa Isabel",
                        reflection: "Y saludó a Isabel que le dijo: \"Bienaventurada la que ha creído porque lo que le ha dicho el Señor se cumplirá.\""
                    },
                    {
                        number: 3,
                        title: "El Nacimiento del Hijo de Dios en Belén",
                        reflection: "Y dio a luz a su hijo primogénito, lo envolvió en pañales y lo recostó en un pesebre porque no había sitio para ellos en la posada."
                    },
                    {
                        number: 4,
                        title: "La Presentación del Niño Jesús en el Templo",
                        reflection: "Cuando se cumplieron los días de su purificación según la ley de Moisés, lo llevaron a Jerusalén para presentarlo al Señor."
                    },
                    {
                        number: 5,
                        title: "El Niño perdido y hallado en el Templo",
                        reflection: "Y sucedió que a los tres días lo encontraron en el templo sentado en medio de los maestros, escuchándolos y haciéndoles preguntas."
                    }
                ]
            },
            luminous: {
                name: "Misterios Luminosos",
                days: ["Jueves"],
                decades: [
                    {
                        number: 1,
                        title: "El Bautismo del Señor",
                        reflection: "Bajó el Espíritu Santo sobre él con apariencia corporal semejante a una paloma y vino una voz del cielo: \"Tú eres mi hijo el amado, en ti me complazco.\""
                    },
                    {
                        number: 2,
                        title: "Las Bodas de Caná",
                        reflection: "Faltó el vino y la madre de Jesús le dice: \"¿No tienen vino?\" Jesús le dice: \"Mujer ¿qué tengo yo que ver contigo? Todavía no ha llegado mi hora.\" Su madre dice a los sirvientes: \"Haced lo que él os diga.\""
                    },
                    {
                        number: 3,
                        title: "El Anuncio del Reino de Dios invitando a la Conversión",
                        reflection: "Desde ese entonces comenzó Jesús a predicar diciendo: \"Conviértanse porque está cerca el reino de los cielos.\""
                    },
                    {
                        number: 4,
                        title: "La Transfiguración del Señor",
                        reflection: "Se transfiguró delante de ellos y su rostro resplandecía como el sol y sus vestidos se volvieron blancos como la luz."
                    },
                    {
                        number: 5,
                        title: "La Institución de la Eucaristía",
                        reflection: "Mientras comían tomó pan y pronunciando la bendición lo partió y se los dio diciendo: \"Tomad, esto es mi cuerpo.\""
                    }
                ]
            },
            sorrowful: {
                name: "Misterios Dolorosos",
                days: ["Martes", "Viernes"],
                decades: [
                    {
                        number: 1,
                        title: "La Oración del Huerto",
                        reflection: "Padre, si quieres, aparta de mí este cáliz, pero que no se haga mi voluntad, sino la tuya."
                    },
                    {
                        number: 2,
                        title: "La Flagelación del Señor",
                        reflection: "Mirad, estamos subiendo a Jerusalén y se cumplirá en el Hijo del Hombre todo lo escrito por los profetas, pues será entregado a los gentiles y será escarnecido, insultado y escupido y después de azotarlo lo matarán y al tercer día resucitará."
                    },
                    {
                        number: 3,
                        title: "La Coronación de Espinas",
                        reflection: "Y los soldados trenzaron una corona de espinas, se la pusieron en la cabeza y le echaron por encima un manto color púrpura y acercándose a él le decían: \"¡Salve rey de los judíos!\" Y le daban bofetadas."
                    },
                    {
                        number: 4,
                        title: "Jesús con la cruz a cuestas",
                        reflection: "Pasaba uno que volvía del campo, Simón de Cirene, el padre de Alejandro y de Rufo, y lo obligaban a llevar la cruz."
                    },
                    {
                        number: 5,
                        title: "Jesús muere en la cruz",
                        reflection: "Nadie tiene amor más grande que el que da la vida por sus amigos."
                    }
                ]
            },
            glorious: {
                name: "Misterios Gloriosos",
                days: ["Miércoles", "Domingo"],
                decades: [
                    {
                        number: 1,
                        title: "La Resurrección del Señor",
                        reflection: "Contestó Tomás: \"Señor mío y Dios mío.\" Jesús le dijo: \"Porque me has visto has creído. Bienaventurados los que crean sin haber visto.\""
                    },
                    {
                        number: 2,
                        title: "La Ascensión del Señor a los cielos",
                        reflection: "Y mientras los bendecía, se separó de ellos y fue llevado hacia el cielo. Ellos se postraron ante él y se volvieron a Jerusalén con gran alegría."
                    },
                    {
                        number: 3,
                        title: "La Venida del Espíritu Santo",
                        reflection: "Vieron aparecer unas lenguas como llamaradas que se dividían posándose encima de cada uno de ellos."
                    },
                    {
                        number: 4,
                        title: "La Asunción de Nuestra Señora",
                        reflection: "Una mujer de entre el gentío, levantando la voz, le dijo: \"Bienaventurado el vientre que te llevó y los pechos que te criaron.\" Pero él dijo: \"Mejor bienaventurados los que escuchan la palabra de Dios y la cumplen.\""
                    },
                    {
                        number: 5,
                        title: "La Coronación de María Santísima",
                        reflection: "Desde ahora me felicitarán todas las generaciones porque el poderoso ha hecho obras grandes en mí."
                    }
                ]
            }
        }
    }
};
