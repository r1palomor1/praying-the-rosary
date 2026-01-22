import { Romcal } from 'romcal';
import GeneralRoman_En from '@romcal/calendar.general-roman/bundles/en.js';
import GeneralRoman_Es from '@romcal/calendar.general-roman/bundles/es.js';

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
        // Parse query parameters
        const queryDate = request.query.date ? new Date(request.query.date + 'T12:00:00') : new Date();
        const locale = request.query.locale || 'en';

        const year = queryDate.getFullYear();
        const month = String(queryDate.getMonth() + 1).padStart(2, '0'); // 1-indexed, zero-padded
        const day = String(queryDate.getDate()).padStart(2, '0');
        const isoDate = `${year}-${month}-${day}`;

        console.log(`[Liturgy API v3] Fetching for ${isoDate}, locale: ${locale}`);

        // Initialize Romcal with the correct localized calendar
        const romcal = new Romcal({
            localizedCalendar: locale === 'es' ? GeneralRoman_Es : GeneralRoman_En,
        });

        // Generate calendar for the year
        const calendarData = await romcal.generateCalendar(year);

        // Get today's liturgical day(s)
        const todaysLiturgicalDays = calendarData[isoDate];

        if (!todaysLiturgicalDays || todaysLiturgicalDays.length === 0) {
            // Fallback if no data found
            return response.status(200).json({
                date: isoDate,
                season: locale === 'es' ? 'Tiempo Ordinario' : 'Ordinary Time',
                season_week: 1,
                weekday: queryDate.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'long' }),
                celebrations: [{
                    title: locale === 'es' ? 'Ferial' : 'Ferial',
                    colour: 'green',
                    rank: 'ferial',
                    rank_num: 1
                }]
            });
        }

        // The first item is always the primary celebration (romcal v3 handles priority)
        const primaryDay = todaysLiturgicalDays[0];

        // Map to our interface
        const mappedData = {
            date: isoDate,
            season: primaryDay.seasons?.[0] || (locale === 'es' ? 'Tiempo Ordinario' : 'Ordinary Time'),
            season_week: primaryDay.calendar?.weekOfSeason || 1,
            weekday: queryDate.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'long' }),
            celebrations: todaysLiturgicalDays.map(day => ({
                title: day.name || (locale === 'es' ? 'Ferial' : 'Ferial'),
                colour: (day.colors?.[0] || 'GREEN').toLowerCase(),
                rank: day.rank || 'ferial',
                rank_num: day.precedence || 1
            }))
        };

        console.log(`[Liturgy API v3] Returning: ${mappedData.celebrations[0].title} (${mappedData.celebrations[0].colour})`);
        response.status(200).json(mappedData);

    } catch (error) {
        console.error('Liturgy API Error:', error);
        response.status(500).json({
            error: 'Failed to fetch liturgical data',
            details: error.message,
            stack: error.stack
        });
    }
}
