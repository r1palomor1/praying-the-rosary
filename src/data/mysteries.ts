import type { MysterySet } from '../types';

export const mysterySets: MysterySet[] = [
    {
        type: 'joyful',
        name: {
            en: 'The Joyful Mysteries',
            es: 'Los Misterios Gozosos'
        },
        days: ['monday', 'saturday'],
        mysteries: [
            {
                number: 1,
                title: {
                    en: 'The Annunciation',
                    es: 'La Anunciación'
                },
                scripture: {
                    en: {
                        reference: 'Luke 1:26-38',
                        text: 'The angel Gabriel was sent from God to a town of Galilee called Nazareth, to a virgin betrothed to a man named Joseph, of the house of David, and the virgin\'s name was Mary. And coming to her, he said, "Hail, favored one! The Lord is with you."'
                    },
                    es: {
                        reference: 'Lucas 1:26-38',
                        text: 'El ángel Gabriel fue enviado por Dios a una ciudad de Galilea llamada Nazaret, a una virgen desposada con un hombre llamado José, de la casa de David; el nombre de la virgen era María. Y entrando, le dijo: "Alégrate, llena de gracia, el Señor está contigo."'
                    }
                },
                reflection: {
                    en: 'Mary\'s "yes" to God changed the course of human history. In her humility and trust, she became the Mother of God. Let us pray for the grace to say "yes" to God\'s will in our own lives, trusting in His perfect plan.',
                    es: 'El "sí" de María a Dios cambió el curso de la historia humana. En su humildad y confianza, se convirtió en la Madre de Dios. Pidamos la gracia de decir "sí" a la voluntad de Dios en nuestras propias vidas, confiando en Su plan perfecto.'
                },
                fruit: {
                    en: 'Humility',
                    es: 'Humildad'
                },
                imageUrl: '/images/mysteries/annunciation.png'
            },
            {
                number: 2,
                title: {
                    en: 'The Visitation',
                    es: 'La Visitación'
                },
                scripture: {
                    en: {
                        reference: 'Luke 1:39-45',
                        text: 'Mary set out and traveled to the hill country in haste to a town of Judah, where she entered the house of Zechariah and greeted Elizabeth. When Elizabeth heard Mary\'s greeting, the infant leaped in her womb, and Elizabeth, filled with the Holy Spirit, cried out in a loud voice and said, "Most blessed are you among women, and blessed is the fruit of your womb."'
                    },
                    es: {
                        reference: 'Lucas 1:39-45',
                        text: 'María se puso en camino y fue de prisa a la montaña, a una ciudad de Judá; entró en casa de Zacarías y saludó a Isabel. Y sucedió que, en cuanto Isabel oyó el saludo de María, saltó de gozo el niño en su seno, e Isabel, llena del Espíritu Santo, exclamó a grandes voces: "Bendita tú entre las mujeres y bendito el fruto de tu seno."'
                    }
                },
                reflection: {
                    en: 'Mary, carrying Jesus within her, brings joy and the Holy Spirit to Elizabeth and John the Baptist. Through her charity and service, she shows us how to bring Christ to others. May we, like Mary, carry Christ to all we meet.',
                    es: 'María, llevando a Jesús en su seno, trae alegría y el Espíritu Santo a Isabel y a Juan el Bautista. A través de su caridad y servicio, nos muestra cómo llevar a Cristo a los demás. Que nosotros, como María, llevemos a Cristo a todos los que encontremos.'
                },
                fruit: {
                    en: 'Love of Neighbor',
                    es: 'Amor al Prójimo'
                },
                imageUrl: '/images/mysteries/visitation.png'
            },
            {
                number: 3,
                title: {
                    en: 'The Nativity',
                    es: 'El Nacimiento de Jesús'
                },
                scripture: {
                    en: {
                        reference: 'Luke 2:6-7',
                        text: 'While they were there, the time came for her to have her child, and she gave birth to her firstborn son. She wrapped him in swaddling clothes and laid him in a manger, because there was no room for them in the inn.'
                    },
                    es: {
                        reference: 'Lucas 2:6-7',
                        text: 'Y sucedió que, mientras ellos estaban allí, se cumplieron los días de su parto, y dio a luz a su hijo primogénito, lo envolvió en pañales y lo acostó en un pesebre, porque no había sitio para ellos en la posada.'
                    }
                },
                reflection: {
                    en: 'The King of Kings is born in poverty and humility. God becomes man in the most humble circumstances, teaching us that true greatness lies in humility and simplicity. Let us welcome Jesus into our hearts as the shepherds welcomed Him in Bethlehem.',
                    es: 'El Rey de Reyes nace en la pobreza y la humildad. Dios se hace hombre en las circunstancias más humildes, enseñándonos que la verdadera grandeza reside en la humildad y la sencillez. Acojamos a Jesús en nuestros corazones como los pastores lo acogieron en Belén.'
                },
                fruit: {
                    en: 'Poverty',
                    es: 'Pobreza'
                },
                imageUrl: '/images/mysteries/nativity.png'
            },
            {
                number: 4,
                title: {
                    en: 'The Presentation',
                    es: 'La Presentación de Jesús en el Templo'
                },
                scripture: {
                    en: {
                        reference: 'Luke 2:22-32',
                        text: 'When the days were completed for their purification according to the law of Moses, they took him up to Jerusalem to present him to the Lord. Simeon took him into his arms and blessed God, saying: "Now, Master, you may let your servant go in peace, according to your word, for my eyes have seen your salvation."'
                    },
                    es: {
                        reference: 'Lucas 2:22-32',
                        text: 'Cuando se cumplieron los días de la purificación de ellos, según la Ley de Moisés, llevaron a Jesús a Jerusalén para presentarle al Señor. Simeón lo tomó en brazos y bendijo a Dios diciendo: "Ahora, Señor, puedes, según tu palabra, dejar que tu siervo se vaya en paz; porque han visto mis ojos tu salvación."'
                    }
                },
                reflection: {
                    en: 'Mary and Joseph obediently fulfill the Law, presenting Jesus in the Temple. Simeon recognizes the Messiah and prophesies that a sword will pierce Mary\'s heart. Let us offer ourselves to God as Mary and Joseph offered Jesus.',
                    es: 'María y José cumplen obedientemente la Ley, presentando a Jesús en el Templo. Simeón reconoce al Mesías y profetiza que una espada atravesará el corazón de María. Ofrezcámonos a Dios como María y José ofrecieron a Jesús.'
                },
                fruit: {
                    en: 'Obedience',
                    es: 'Obediencia'
                },
                imageUrl: '/images/mysteries/presentation.png'
            },
            {
                number: 5,
                title: {
                    en: 'The Finding in the Temple',
                    es: 'El Niño Jesús Perdido y Hallado en el Templo'
                },
                scripture: {
                    en: {
                        reference: 'Luke 2:46-50',
                        text: 'After three days they found him in the temple, sitting in the midst of the teachers, listening to them and asking them questions. When his parents saw him, they were astonished. He said to them, "Why were you looking for me? Did you not know that I must be in my Father\'s house?"'
                    },
                    es: {
                        reference: 'Lucas 2:46-50',
                        text: 'Y sucedió que, al cabo de tres días, le encontraron en el Templo sentado en medio de los maestros, escuchándoles y preguntándoles. Cuando le vieron, quedaron sorprendidos. Él les dijo: "¿Por qué me buscabais? ¿No sabíais que yo debía estar en la casa de mi Padre?"'
                    }
                },
                reflection: {
                    en: 'Even as a child, Jesus shows His divine mission and wisdom. Mary and Joseph search for Him with anguish, teaching us to always seek Jesus when we feel lost. May we always put God first in our lives.',
                    es: 'Incluso siendo niño, Jesús muestra su misión divina y sabiduría. María y José lo buscan con angustia, enseñándonos a buscar siempre a Jesús cuando nos sentimos perdidos. Que siempre pongamos a Dios primero en nuestras vidas.'
                },
                fruit: {
                    en: 'Piety',
                    es: 'Piedad'
                },
                imageUrl: '/images/mysteries/finding-temple.png'
            }
        ]
    },
    {
        type: 'luminous',
        name: {
            en: 'The Luminous Mysteries',
            es: 'Los Misterios Luminosos'
        },
        days: ['thursday'],
        mysteries: [
            {
                number: 1,
                title: {
                    en: 'The Baptism of Jesus',
                    es: 'El Bautismo de Jesús'
                },
                scripture: {
                    en: {
                        reference: 'Matthew 3:16-17',
                        text: 'After Jesus was baptized, he came up from the water and behold, the heavens were opened for him, and he saw the Spirit of God descending like a dove and coming upon him. And a voice came from the heavens, saying, "This is my beloved Son, with whom I am well pleased."'
                    },
                    es: {
                        reference: 'Mateo 3:16-17',
                        text: 'Bautizado Jesús, salió luego del agua; y en esto se abrieron los cielos y vio al Espíritu de Dios que bajaba en forma de paloma y venía sobre él. Y una voz que salía de los cielos decía: "Este es mi Hijo amado, en quien me complazco."'
                    }
                },
                reflection: {
                    en: 'At His baptism, Jesus begins His public ministry. The Father proclaims Him as His beloved Son, and the Holy Spirit descends upon Him. We too are beloved children of God through our baptism. Let us live worthy of this great gift.',
                    es: 'En su bautismo, Jesús comienza su ministerio público. El Padre lo proclama como su Hijo amado, y el Espíritu Santo desciende sobre Él. Nosotros también somos hijos amados de Dios por nuestro bautismo. Vivamos dignos de este gran don.'
                },
                fruit: {
                    en: 'Openness to the Holy Spirit',
                    es: 'Apertura al Espíritu Santo'
                },
                imageUrl: '/images/mysteries/baptism.jpg'
            },
            {
                number: 2,
                title: {
                    en: 'The Wedding at Cana',
                    es: 'Las Bodas de Caná'
                },
                scripture: {
                    en: {
                        reference: 'John 2:1-11',
                        text: 'There was a wedding in Cana in Galilee, and the mother of Jesus was there. Jesus and his disciples were also invited to the wedding. When the wine ran short, the mother of Jesus said to him, "They have no wine." Jesus did this as the beginning of his signs in Cana in Galilee and so revealed his glory, and his disciples began to believe in him.'
                    },
                    es: {
                        reference: 'Juan 2:1-11',
                        text: 'Se celebraba una boda en Caná de Galilea y estaba allí la madre de Jesús. Fue invitado también a la boda Jesús con sus discípulos. Y, como faltara vino, la madre de Jesús le dice: "No tienen vino." Jesús realizó este primer signo en Caná de Galilea. Así manifestó su gloria y creyeron en él sus discípulos.'
                    }
                },
                reflection: {
                    en: 'At Mary\'s request, Jesus performs His first miracle, changing water into wine. Mary\'s words, "Do whatever He tells you," are a guide for our lives. Through her intercession, Jesus continues to work miracles in our lives.',
                    es: 'A petición de María, Jesús realiza su primer milagro, convirtiendo el agua en vino. Las palabras de María, "Haced lo que Él os diga", son una guía para nuestras vidas. Por su intercesión, Jesús continúa obrando milagros en nuestras vidas.'
                },
                fruit: {
                    en: 'To Jesus through Mary',
                    es: 'A Jesús por María'
                },
                imageUrl: '/images/mysteries/wedding_cana.jpg'
            },
            {
                number: 3,
                title: {
                    en: 'The Proclamation of the Kingdom',
                    es: 'El Anuncio del Reino de Dios'
                },
                scripture: {
                    en: {
                        reference: 'Mark 1:14-15',
                        text: 'After John had been arrested, Jesus came to Galilee proclaiming the gospel of God: "This is the time of fulfillment. The kingdom of God is at hand. Repent, and believe in the gospel."'
                    },
                    es: {
                        reference: 'Marcos 1:14-15',
                        text: 'Después que Juan fue entregado, marchó Jesús a Galilea; y proclamaba la Buena Nueva de Dios: "El tiempo se ha cumplido y el Reino de Dios está cerca; convertíos y creed en la Buena Nueva."'
                    }
                },
                reflection: {
                    en: 'Jesus proclaims the Kingdom of God and calls us to repentance and faith. His message is urgent and transformative. Let us open our hearts to His word and live as citizens of His Kingdom.',
                    es: 'Jesús proclama el Reino de Dios y nos llama al arrepentimiento y la fe. Su mensaje es urgente y transformador. Abramos nuestros corazones a su palabra y vivamos como ciudadanos de su Reino.'
                },
                fruit: {
                    en: 'Repentance and Trust in God',
                    es: 'Arrepentimiento y confianza en Dios'
                },
                imageUrl: '/images/mysteries/proclamation.jpg'
            },
            {
                number: 4,
                title: {
                    en: 'The Transfiguration',
                    es: 'La Transfiguración'
                },
                scripture: {
                    en: {
                        reference: 'Matthew 17:1-2',
                        text: 'Jesus took Peter, James, and John his brother, and led them up a high mountain by themselves. And he was transfigured before them; his face shone like the sun and his clothes became white as light.'
                    },
                    es: {
                        reference: 'Mateo 17:1-2',
                        text: 'Jesús toma consigo a Pedro, a Santiago y a Juan, su hermano, y los lleva aparte a un monte alto. Y se transfiguró delante de ellos: su rostro se puso brillante como el sol y sus vestidos se volvieron blancos como la luz.'
                    }
                },
                reflection: {
                    en: 'On Mount Tabor, Jesus reveals His divine glory to strengthen the apostles for the trials ahead. This glimpse of heaven reminds us of our ultimate destiny. May we keep our eyes fixed on the glory that awaits us.',
                    es: 'En el Monte Tabor, Jesús revela su gloria divina para fortalecer a los apóstoles ante las pruebas venideras. Este vislumbre del cielo nos recuerda nuestro destino final. Que mantengamos nuestros ojos fijos en la gloria que nos espera.'
                },
                fruit: {
                    en: 'Desire for Holiness',
                    es: 'Deseo de santidad'
                },
                imageUrl: '/images/mysteries/transfiguration.jpg'
            },
            {
                number: 5,
                title: {
                    en: 'The Institution of the Eucharist',
                    es: 'La Institución de la Eucaristía'
                },
                scripture: {
                    en: {
                        reference: 'Luke 22:19-20',
                        text: 'Then he took the bread, said the blessing, broke it, and gave it to them, saying, "This is my body, which will be given for you; do this in memory of me." And likewise the cup after they had eaten, saying, "This cup is the new covenant in my blood, which will be shed for you."'
                    },
                    es: {
                        reference: 'Lucas 22:19-20',
                        text: 'Tomó luego pan, y, dadas las gracias, lo partió y se lo dio diciendo: "Este es mi cuerpo que es entregado por vosotros; haced esto en recuerdo mío." De igual modo, después de cenar, tomó el cáliz, diciendo: "Este cáliz es la Nueva Alianza en mi sangre, que es derramada por vosotros."'
                    }
                },
                reflection: {
                    en: 'At the Last Supper, Jesus gives us the greatest gift: Himself in the Eucharist. He becomes our spiritual food, uniting us to Him and to each other. Let us receive Him worthily and with deep gratitude.',
                    es: 'En la Última Cena, Jesús nos da el mayor regalo: Él mismo en la Eucaristía. Se convierte en nuestro alimento espiritual, uniéndonos a Él y entre nosotros. Recibámoslo dignamente y con profunda gratitud.'
                },
                fruit: {
                    en: 'Adoration',
                    es: 'Adoración'
                },
                imageUrl: '/images/mysteries/eucharist.jpg'
            }
        ]
    },
    {
        type: 'sorrowful',
        name: {
            en: 'The Sorrowful Mysteries',
            es: 'Los Misterios Dolorosos'
        },
        days: ['tuesday', 'friday'],
        mysteries: [
            {
                number: 1,
                title: {
                    en: 'The Agony in the Garden',
                    es: 'La Oración de Jesús en el Huerto'
                },
                scripture: {
                    en: {
                        reference: 'Luke 22:41-44',
                        text: 'He withdrew about a stone\'s throw from them and knelt down and prayed, "Father, if you are willing, take this cup away from me; still, not my will but yours be done." And to strengthen him an angel from heaven appeared to him. He was in such agony and he prayed so fervently that his sweat became like drops of blood falling on the ground.'
                    },
                    es: {
                        reference: 'Lucas 22:41-44',
                        text: 'Se apartó de ellos como un tiro de piedra, y puesto de rodillas oraba diciendo: "Padre, si quieres, aparta de mí este cáliz; pero no se haga mi voluntad, sino la tuya." Entonces, se le apareció un ángel venido del cielo que le confortaba. Y sumido en agonía, insistía más en su oración. Su sudor se hizo como gotas espesas de sangre que caían en tierra.'
                    }
                },
                reflection: {
                    en: 'In the Garden of Gethsemane, Jesus experiences profound anguish, yet He submits to the Father\'s will. He shows us how to face our own trials with prayer and surrender to God\'s plan.',
                    es: 'En el Huerto de Getsemaní, Jesús experimenta una profunda angustia, pero se somete a la voluntad del Padre. Nos muestra cómo enfrentar nuestras propias pruebas con oración y entrega al plan de Dios.'
                },
                fruit: {
                    en: 'Sorrow for Sin',
                    es: 'Dolor por los pecados'
                },
                imageUrl: '/images/mysteries/agony_garden.jpg'
            },
            {
                number: 2,
                title: {
                    en: 'The Scourging at the Pillar',
                    es: 'La Flagelación de Jesús'
                },
                scripture: {
                    en: {
                        reference: 'John 19:1',
                        text: 'Then Pilate took Jesus and had him scourged.'
                    },
                    es: {
                        reference: 'Juan 19:1',
                        text: 'Entonces Pilato tomó a Jesús y mandó azotarle.'
                    }
                },
                reflection: {
                    en: 'Jesus endures brutal scourging for our sins. Each lash was for our healing and redemption. Let us contemplate the price of our salvation and turn away from sin.',
                    es: 'Jesús soporta una brutal flagelación por nuestros pecados. Cada latigazo fue para nuestra sanación y redención. Contemplemos el precio de nuestra salvación y alejémonos del pecado.'
                },
                fruit: {
                    en: 'Purity',
                    es: 'Pureza'
                },
                imageUrl: '/images/mysteries/scourging.jpg'
            },
            {
                number: 3,
                title: {
                    en: 'The Crowning with Thorns',
                    es: 'La Coronación de Espinas'
                },
                scripture: {
                    en: {
                        reference: 'Matthew 27:28-29',
                        text: 'They stripped off his clothes and threw a scarlet military cloak about him. Weaving a crown out of thorns, they placed it on his head, and a reed in his right hand. And kneeling before him, they mocked him, saying, "Hail, King of the Jews!"'
                    },
                    es: {
                        reference: 'Mateo 27:28-29',
                        text: 'Y, desnudándole, le echaron encima un manto de púrpura; y, trenzando una corona de espinas, se la pusieron sobre su cabeza, y en su mano derecha una caña; y doblando la rodilla delante de él, le hacían burla diciendo: "¡Salve, Rey de los judíos!"'
                    }
                },
                reflection: {
                    en: 'Jesus, the true King, is mocked and crowned with thorns. He accepts this humiliation out of love for us. May we honor Him as our King and reject the pride that led to His suffering.',
                    es: 'Jesús, el verdadero Rey, es burlado y coronado con espinas. Acepta esta humillación por amor a nosotros. Honrémoslo como nuestro Rey y rechacemos el orgullo que llevó a su sufrimiento.'
                },
                fruit: {
                    en: 'Moral Courage',
                    es: 'Coraje moral'
                },
                imageUrl: '/images/mysteries/crowning_with_thorns.jpg'
            },
            {
                number: 4,
                title: {
                    en: 'The Carrying of the Cross',
                    es: 'Jesús Carga con la Cruz'
                },
                scripture: {
                    en: {
                        reference: 'John 19:17',
                        text: 'So they took Jesus, and carrying the cross himself he went out to what is called the Place of the Skull, in Hebrew, Golgotha.'
                    },
                    es: {
                        reference: 'Juan 19:17',
                        text: 'Y él, cargando con su cruz, salió hacia el lugar llamado Calvario, que en hebreo se llama Gólgota.'
                    }
                },
                reflection: {
                    en: 'Jesus carries His cross to Calvary, falling under its weight yet rising again. He invites us to take up our own crosses and follow Him. With His help, we can bear any burden.',
                    es: 'Jesús lleva su cruz al Calvario, cayendo bajo su peso pero levantándose de nuevo. Nos invita a tomar nuestras propias cruces y seguirlo. Con su ayuda, podemos soportar cualquier carga.'
                },
                fruit: {
                    en: 'Patience',
                    es: 'Paciencia'
                },
                imageUrl: '/images/mysteries/carrying_cross.jpg'
            },
            {
                number: 5,
                title: {
                    en: 'The Crucifixion',
                    es: 'La Crucifixión y Muerte de Jesús'
                },
                scripture: {
                    en: {
                        reference: 'Luke 23:33-34, 46',
                        text: 'When they came to the place called the Skull, they crucified him and the criminals there, one on his right, the other on his left. Then Jesus said, "Father, forgive them, they know not what they do." Jesus cried out in a loud voice, "Father, into your hands I commend my spirit"; and when he had said this he breathed his last.'
                    },
                    es: {
                        reference: 'Lucas 23:33-34, 46',
                        text: 'Cuando llegaron al lugar llamado Calvario, le crucificaron allí a él y a los malhechores, uno a la derecha y otro a la izquierda. Jesús decía: "Padre, perdónales, porque no saben lo que hacen." Jesús, dando un fuerte grito, dijo: "Padre, en tus manos encomiendo mi espíritu" y, dicho esto, expiró.'
                    }
                },
                reflection: {
                    en: 'On the cross, Jesus offers the perfect sacrifice for our sins. His last words are of forgiveness and trust. Through His death, we receive eternal life. Let us never forget the price of our redemption.',
                    es: 'En la cruz, Jesús ofrece el sacrificio perfecto por nuestros pecados. Sus últimas palabras son de perdón y confianza. Por su muerte, recibimos la vida eterna. Nunca olvidemos el precio de nuestra redención.'
                },
                fruit: {
                    en: 'Perseverance',
                    es: 'Perseverancia'
                },
                imageUrl: '/images/mysteries/crucifixion.jpg'
            }
        ]
    },
    {
        type: 'glorious',
        name: {
            en: 'The Glorious Mysteries',
            es: 'Los Misterios Gloriosos'
        },
        days: ['wednesday', 'sunday'],
        mysteries: [
            {
                number: 1,
                title: {
                    en: 'The Resurrection',
                    es: 'La Resurrección de Jesús'
                },
                scripture: {
                    en: {
                        reference: 'Matthew 28:5-6',
                        text: 'Then the angel said to the women in reply, "Do not be afraid! I know that you are seeking Jesus the crucified. He is not here, for he has been raised just as he said."'
                    },
                    es: {
                        reference: 'Mateo 28:5-6',
                        text: 'El ángel se dirigió a las mujeres y les dijo: "Vosotras no temáis, pues sé que buscáis a Jesús, el crucificado; no está aquí, ha resucitado, como lo había dicho."'
                    }
                },
                reflection: {
                    en: 'Christ is risen! Death is conquered, and we have hope of eternal life. The Resurrection is the foundation of our faith. Let us live as Easter people, filled with joy and hope.',
                    es: '¡Cristo ha resucitado! La muerte es vencida, y tenemos esperanza de vida eterna. La Resurrección es el fundamento de nuestra fe. Vivamos como pueblo de Pascua, llenos de alegría y esperanza.'
                },
                fruit: {
                    en: 'Faith',
                    es: 'Fe'
                },
                imageUrl: '/images/mysteries/resurrection.jpg'
            },
            {
                number: 2,
                title: {
                    en: 'The Ascension',
                    es: 'La Ascensión de Jesús'
                },
                scripture: {
                    en: {
                        reference: 'Acts 1:9-11',
                        text: 'When he had said this, as they were looking on, he was lifted up, and a cloud took him from their sight. While they were looking intently at the sky as he was going, suddenly two men dressed in white garments stood beside them. They said, "Men of Galilee, why are you standing there looking at the sky? This Jesus who has been taken up from you into heaven will return in the same way as you have seen him going into heaven."'
                    },
                    es: {
                        reference: 'Hechos 1:9-11',
                        text: 'Y dicho esto, fue levantado en presencia de ellos, y una nube le ocultó a sus ojos. Estando ellos mirando fijamente al cielo mientras él se iba, se les aparecieron dos hombres vestidos de blanco que les dijeron: "Galileos, ¿qué hacéis ahí mirando al cielo? Este que os ha sido llevado, este mismo Jesús, vendrá así tal como le habéis visto subir al cielo."'
                    }
                },
                reflection: {
                    en: 'Jesus ascends to heaven to prepare a place for us. Though He is no longer visible, He remains with us always. Let us keep our eyes on heaven, our true home.',
                    es: 'Jesús asciende al cielo para prepararnos un lugar. Aunque ya no es visible, permanece con nosotros siempre. Mantengamos nuestros ojos en el cielo, nuestro verdadero hogar.'
                },
                fruit: {
                    en: 'Hope',
                    es: 'Esperanza'
                },
                imageUrl: '/images/mysteries/ascension.jpg'
            },
            {
                number: 3,
                title: {
                    en: 'The Descent of the Holy Spirit',
                    es: 'La Venida del Espíritu Santo'
                },
                scripture: {
                    en: {
                        reference: 'Acts 2:1-4',
                        text: 'When the time for Pentecost was fulfilled, they were all in one place together. And suddenly there came from the sky a noise like a strong driving wind, and it filled the entire house in which they were. Then there appeared to them tongues as of fire, which parted and came to rest on each one of them. And they were all filled with the Holy Spirit.'
                    },
                    es: {
                        reference: 'Hechos 2:1-4',
                        text: 'Al llegar el día de Pentecostés, estaban todos reunidos en un mismo lugar. De repente vino del cielo un ruido como el de una ráfaga de viento impetuoso, que llenó toda la casa en la que se encontraban. Se les aparecieron unas lenguas como de fuego que se repartieron y se posaron sobre cada uno de ellos; quedaron todos llenos del Espíritu Santo.'
                    }
                },
                reflection: {
                    en: 'The Holy Spirit descends upon the apostles, transforming them from fearful men into bold witnesses. The same Spirit dwells in us through baptism. Let us open our hearts to His gifts and guidance.',
                    es: 'El Espíritu Santo desciende sobre los apóstoles, transformándolos de hombres temerosos en testigos valientes. El mismo Espíritu habita en nosotros por el bautismo. Abramos nuestros corazones a sus dones y guía.'
                },
                fruit: {
                    en: 'Love of God',
                    es: 'Amor a Dios'
                },
                imageUrl: '/images/mysteries/pentecost.jpg'
            },
            {
                number: 4,
                title: {
                    en: 'The Assumption of Mary',
                    es: 'La Asunción de María'
                },
                scripture: {
                    en: {
                        reference: 'Revelation 12:1',
                        text: 'A great sign appeared in the sky, a woman clothed with the sun, with the moon under her feet, and on her head a crown of twelve stars.'
                    },
                    es: {
                        reference: 'Apocalipsis 12:1',
                        text: 'Una gran señal apareció en el cielo: una Mujer, vestida del sol, con la luna bajo sus pies, y una corona de doce estrellas sobre su cabeza.'
                    }
                },
                reflection: {
                    en: 'Mary, preserved from sin, is assumed body and soul into heaven. She is our mother and our hope, showing us the glory that awaits the faithful. May we follow her example of holiness.',
                    es: 'María, preservada del pecado, es asunta en cuerpo y alma al cielo. Ella es nuestra madre y nuestra esperanza, mostrándonos la gloria que espera a los fieles. Sigamos su ejemplo de santidad.'
                },
                fruit: {
                    en: 'Grace of a Happy Death',
                    es: 'Gracia de una buena muerte'
                },
                imageUrl: '/images/mysteries/assumption.jpg'
            },
            {
                number: 5,
                title: {
                    en: 'The Coronation of Mary',
                    es: 'La Coronación de María'
                },
                scripture: {
                    en: {
                        reference: 'Revelation 12:1',
                        text: 'A great sign appeared in the sky, a woman clothed with the sun, with the moon under her feet, and on her head a crown of twelve stars.'
                    },
                    es: {
                        reference: 'Apocalipsis 12:1',
                        text: 'Una gran señal apareció en el cielo: una Mujer, vestida del sol, con la luna bajo sus pies, y una corona de doce estrellas sobre su cabeza.'
                    }
                },
                reflection: {
                    en: 'Mary is crowned Queen of Heaven and Earth. She reigns with her Son and intercedes for us constantly. Let us honor her as our Queen and trust in her maternal care.',
                    es: 'María es coronada Reina del Cielo y de la Tierra. Reina con su Hijo e intercede por nosotros constantemente. Honrémosla como nuestra Reina y confiemos en su cuidado maternal.'
                },
                fruit: {
                    en: 'Trust in Mary\'s Intercession',
                    es: 'Confianza en la intercesión de María'
                },
                imageUrl: '/images/mysteries/coronation.jpg'
            }
        ]
    }
];
