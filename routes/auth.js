const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For device fingerprinting mock
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const { logSecurityEvent } = require('../middleware/securityLogger');
const RiskEngine = require('../utils/riskEngine');

const router = express.Router();

// Helper: Generate Device Hash (Simple Mock)
const getDeviceHash = (req) => {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip;
    return crypto.createHash('sha256').update(userAgent + ip).digest('hex');
};

// LOGIN ROUTE (ADAPTIVE)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const deviceHash = getDeviceHash(req);

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }

    try {
        // 1. Fetch User
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            logSecurityEvent(null, 'LOGIN_FAIL_NO_USER', req.ip, `Email: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = users[0];

        // 2. Check Risk Level
        const { score, level } = await RiskEngine.getRiskScore(user.id);

        // CRITICAL RISK: Block Login
        if (level === 'CRITICAL' || level === 'HIGH') {
            // Allow login ONLY if it's the admin or special flow (omitted for simplicity, just blocking hard here)
            // Real world: require Admin unlock or Email reset.
            logSecurityEvent(user.id, 'LOGIN_BLOCKED_HIGH_RISK', req.ip, `Risk Score: ${score}`);
            return res.status(403).json({
                message: 'Account blocked due to high risk activity. Contact support.',
                riskScore: score
            });
        }

        // 3. Verify Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            await RiskEngine.updateRiskScore(user.id, 'LOGIN_FAIL');
            logSecurityEvent(user.id, 'LOGIN_FAIL_PASSWORD', req.ip, 'Invalid password');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 4. Adaptive Checks (New Device?)
        const isNewDevice = await RiskEngine.isNewDevice(user.id, deviceHash);
        if (isNewDevice) {
            await RiskEngine.updateRiskScore(user.id, 'NEW_DEVICE');
            logSecurityEvent(user.id, 'NEW_DEVICE_DETECTED', req.ip, 'Login from new device');

            // If Risk is now MEDIUM/HIGH, trigger Challenge (Mock)
            // For now, we just add the device and proceed, but warn.
            await RiskEngine.addDevice(user.id, deviceHash, req.headers['user-agent']);
        }

        // 5. Success Logic (Reduce Risk)
        await RiskEngine.updateRiskScore(user.id, 'LOGIN_SUCCESS');

        // Reset legacy locks
        await db.execute('UPDATE users SET failed_login_attempts = 0 WHERE id = ?', [user.id]);

        // Generate Token
        const token = jwt.sign({ id: user.id, riskLevel: level }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000
        });

        // Return login info + Risk Info for UI
        res.status(200).json({
            message: 'Logged in successfully',
            user: { username: user.username, email: user.email },
            riskScore: score, // Leaking score for demo purposes
            riskLevel: level
        });

        logSecurityEvent(user.id, 'LOGIN_SUCCESS', req.ip, `Risk Score: ${score}`);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// REGISTER ROUTE (Standard + Device Reg)
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const [existing] = await db.execute('SELECT email FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Email exists' });

        // Password Policy Enforcement
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a symbol.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashed]
        );
        const userId = result.insertId;

        // Initialize Risk Score
        await RiskEngine.updateRiskScore(userId, 'REGISTER'); // Just inits entry

        // Trust this device
        const deviceHash = getDeviceHash(req);
        await RiskEngine.addDevice(userId, deviceHash, req.headers['user-agent']);

        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// LOGOUT & CHECK SESSION (Standard)
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

const verifyToken = require('../middleware/authMiddleware');
router.get('/check-session', verifyToken, async (req, res) => {
    // Fetch latest risk score to show on dashboard
    const { score, level } = await RiskEngine.getRiskScore(req.user.id);
    res.json({
        user: req.user,
        isAuthenticated: true,
        riskScore: score,
        riskLevel: level
    });
});

module.exports = router;
