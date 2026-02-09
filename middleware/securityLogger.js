const db = require('../config/db');

/**
 * Logs security-related events to the database.
 * @param {number|null} userId - The ID of the user (if known).
 * @param {string} eventType - The type of event (e.g., 'LOGIN_FAIL', 'SQLI_ATTEMPT').
 * @param {string} ipAddress - The IP address of the requester.
 * @param {string} description - Additional details describing the event.
 */
async function logSecurityEvent(userId, eventType, ipAddress, description = '') {
    try {
        const query = `
            INSERT INTO security_logs (user_id, event_type, ip_address, description, timestamp)
            VALUES (?, ?, ?, ?, NOW())
        `;
        await db.execute(query, [userId, eventType, ipAddress, description]);
        console.log(`[SECURITY LOG] ${eventType} from ${ipAddress}: ${description}`);
    } catch (err) {
        console.error('Failed to log security event:', err);
    }
}

module.exports = { logSecurityEvent };
