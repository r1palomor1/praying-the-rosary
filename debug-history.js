// Diagnostic script to check localStorage data
// Run this in browser console

console.log('=== ROSARY HISTORY ===');
const rosaryHistory = localStorage.getItem('rosary_prayer_history');
if (rosaryHistory) {
    const parsed = JSON.parse(rosaryHistory);
    console.log('Total entries:', parsed.length);
    console.log('Entries:', parsed);

    // Group by date
    const byDate = {};
    parsed.forEach(entry => {
        if (!byDate[entry.date]) {
            byDate[entry.date] = [];
        }
        byDate[entry.date].push(entry);
    });

    console.log('\nGrouped by date:');
    Object.keys(byDate).sort().forEach(date => {
        console.log(`${date}: ${byDate[date].length} entries`, byDate[date]);
    });
} else {
    console.log('No rosary history found');
}

console.log('\n=== SACRED PRAYER HISTORY ===');
const sacredHistory = localStorage.getItem('sacred_prayer_history');
if (sacredHistory) {
    const parsed = JSON.parse(sacredHistory);
    console.log('Total entries:', parsed.length);
    console.log('Entries:', parsed);
} else {
    console.log('No sacred prayer history found');
}
