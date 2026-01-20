
import Romcal from 'romcal';

export default async function handler(request, response) {
    // Set CORS headers
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    try {
        const today = new Date();
        const year = today.getFullYear();
        const todayStr = today.toISOString().split('T')[0];

        // Run Romcal for the United States (English)
        // returns array of events
        const events = await Romcal.calendarFor({
            year: year,
            country: 'unitedStates',
            locale: 'en'
        });

        // Debug log to Vercel console
        // console.log(`Generated ${events.length} events for ${year}`);

        // Find today's events
        // Romcal v1.3 uses .moment (string) for date
        const todaysEvents = events.filter(e => e.moment.startsWith(todayStr));

        if (!todaysEvents || todaysEvents.length === 0) {
            return response.status(200).json({
                date: todayStr,
                season: 'Ordinary Time',
                celebrations: [{
                    title: 'Ferial',
                    colour: 'green',
                    rank: 'ferial'
                }]
            });
        }

        // Map to our Interface
        const mappedData = {
            date: todayStr,
            season: todaysEvents[0].season,
            season_week: todaysEvents[0].week,
            weekday: today.toLocaleDateString('en-US', { weekday: 'long' }),
            celebrations: todaysEvents.map(e => ({
                title: e.name,
                colour: e.color ? e.color[0] : 'green', // v1 uses array of colors
                rank: e.rankName,
                rank_num: e.rank
            }))
        };

        response.status(200).json(mappedData);

    } catch (error) {
        console.error('Romcal Backend Error:', error);
        response.status(500).json({
            error: 'Failed to generate liturgical data',
            details: error.message
        });
    }
}
