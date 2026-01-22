const { Romcal } = await import('romcal');
const { GeneralRoman_En } = await import('@romcal/calendar.general-roman/esm/index.js');
const { GeneralRoman_Es } = await import('@romcal/calendar.general-roman/esm/index.js');

const romcalEn = new Romcal({ localizedCalendar: GeneralRoman_En });
const romcalEs = new Romcal({ localizedCalendar: GeneralRoman_Es });

const calEn = await romcalEn.generateCalendar(2026);
const calEs = await romcalEs.generateCalendar(2026);

const jan21En = calEn['2026-01-21'][0];
const jan21Es = calEs['2026-01-21'][0];

console.log('ENGLISH:');
console.log('  name:', jan21En.name);
console.log('  seasonNames[0]:', jan21En.seasonNames?.[0]);
console.log('  colorNames[0]:', jan21En.colorNames?.[0]);

console.log('\nSPANISH:');
console.log('  name:', jan21Es.name);
console.log('  seasonNames[0]:', jan21Es.seasonNames?.[0]);
console.log('  colorNames[0]:', jan21Es.colorNames?.[0]);
