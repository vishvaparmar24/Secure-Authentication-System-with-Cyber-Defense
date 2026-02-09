const db = require('./config/db');

async function viewLogs() {
    try {
        const [rows] = await db.execute('SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 20');

        console.table(rows.map(row => ({
            ID: row.id,
            Event: row.event_type,
            IP: row.ip_address,
            Time: row.timestamp.toLocaleString(),
            Description: row.description
        })));

        process.exit(0);
    } catch (err) {
        console.error('Error fetching logs:', err);
        process.exit(1);
    }
}

viewLogs();
