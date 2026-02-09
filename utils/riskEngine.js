const db = require('../config/db');

class RiskEngine {

    /**
     * Get current risk score for a user
     */
    static async getRiskScore(userId) {
        const [rows] = await db.execute('SELECT risk_score, risk_level FROM user_risk_scores WHERE user_id = ?', [userId]);
        if (rows.length === 0) return { score: 0, level: 'LOW' };
        return { score: rows[0].risk_score, level: rows[0].risk_level };
    }

    /**
     * Update risk score based on an event
     * @param {number} userId 
     * @param {string} eventType - LOGIN_FAIL, NEW_DEVICE, IMPOSSIBLE_TRAVEL, etc.
     */
    static async updateRiskScore(userId, eventType) {
        // Define Risk Weights
        const weights = {
            'LOGIN_FAIL': 10,
            'NEW_DEVICE': 20,
            'NEW_IP': 15,
            'SUSPICIOUS_ACTIVITY': 30,
            'LOGIN_SUCCESS': -5, // Reward for good behavior
            'PASSWORD_RESET': -20 // Reset implies user recovered account
        };

        const weight = weights[eventType] || 0;
        if (weight === 0) return;

        // Get current score
        let { score } = await this.getRiskScore(userId);

        // Calculate new score (0 to 100)
        let newScore = Math.max(0, Math.min(100, score + weight));

        // Determine Level
        let newLevel = 'LOW';
        if (newScore > 30) newLevel = 'MEDIUM';
        if (newScore > 70) newLevel = 'HIGH';
        if (newScore >= 90) newLevel = 'CRITICAL';

        // Upsert into DB
        // Check if exists
        const [exists] = await db.execute('SELECT user_id FROM user_risk_scores WHERE user_id = ?', [userId]);

        if (exists.length > 0) {
            await db.execute(
                'UPDATE user_risk_scores SET risk_score = ?, risk_level = ? WHERE user_id = ?',
                [newScore, newLevel, userId]
            );
        } else {
            await db.execute(
                'INSERT INTO user_risk_scores (user_id, risk_score, risk_level) VALUES (?, ?, ?)',
                [userId, newScore, newLevel]
            );
        }

        console.log(`[RISK ENGINE] User ${userId} Risk Score Updated: ${score} -> ${newScore} (${newLevel})`);
        return { newScore, newLevel };
    }

    /**
     * Check if a device is known for the user
     */
    static async isNewDevice(userId, deviceHash) {
        const [rows] = await db.execute(
            'SELECT * FROM login_devices WHERE user_id = ? AND device_hash = ?',
            [userId, deviceHash]
        );
        return rows.length === 0;
    }

    /**
     * Add a trusted device
     */
    static async addDevice(userId, deviceHash, userAgent) {
        await db.execute(
            'INSERT INTO login_devices (user_id, device_hash, user_agent, is_trusted) VALUES (?, ?, ?, TRUE)',
            [userId, deviceHash, userAgent]
        );
    }
}

module.exports = RiskEngine;
