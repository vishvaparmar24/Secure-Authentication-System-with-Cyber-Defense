const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware to simulate Admin Check (In production, check role/token)
const adminCheck = (req, res, next) => {
    // For portfolio demo, we allow access but normally this would verify Admin Role
    next();
};

// 1. System Stats (Top Cards)
router.get('/stats', adminCheck, async (req, res) => {
    try {
        const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [highRiskCount] = await db.execute('SELECT COUNT(*) as count FROM user_risk_scores WHERE risk_score > 50');
        // Count "Attacks" as anything with FAIL or BLOCKED in event_type
        const [attackCount] = await db.execute("SELECT COUNT(*) as count FROM security_logs WHERE event_type LIKE '%FAIL%' OR event_type LIKE '%BLOCKED%'");

        res.json({
            totalUsers: userCount[0].count,
            highRiskUsers: highRiskCount[0].count,
            totalAttacks: attackCount[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Live Security Events Feed
router.get('/events', adminCheck, async (req, res) => {
    try {
        const [logs] = await db.execute('SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 50');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. User Risk Heatmap Data
router.get('/risk-users', adminCheck, async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT u.id, u.username, u.email, urs.risk_score, urs.risk_level, urs.last_updated 
            FROM users u 
            JOIN user_risk_scores urs ON u.id = urs.user_id 
            ORDER BY urs.risk_score DESC 
            LIMIT 20
        `);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Attack Types Distribution (Chart Data)
router.get('/attack-distribution', adminCheck, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT event_type, COUNT(*) as count 
            FROM security_logs 
            GROUP BY event_type 
            ORDER BY count DESC
        `);

        // Format for Chart.js
        const labels = rows.map(r => r.event_type);
        const data = rows.map(r => r.count);

        res.json({ labels, data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
