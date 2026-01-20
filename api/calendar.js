
export default async function handler(request, response) {
    // Set CORS headers
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    try {
        const apiResponse = await fetch('https://calapi.inadiutorium.cz/api/v0/en/calendars/default/today');

        if (!apiResponse.ok) {
            throw new Error(`Upstream API status: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();

        response.status(200).json(data);
    } catch (error) {
        console.error('Calendar Proxy Error:', error);
        response.status(500).json({
            error: 'Failed to fetch liturgical data',
            details: error.message,
            stack: error.stack
        });
    }
}
