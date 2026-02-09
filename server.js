require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const { logSecurityEvent } = require('./middleware/securityLogger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware: Helmet (Secure Headers)
// Disable CSP for this demo to allow inline scripts and CDNs (Chart.js)
app.use(helmet({ contentSecurityPolicy: false }));

// Security Middleware: Rate Limiting (Global)
// Limit each IP to 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased for dashboard polling
    message: 'Too many requests from this IP, please try again later.',
    handler: (req, res, next, options) => {
        logSecurityEvent(null, 'GLOBAL_RATE_LIMIT_EXCEEDED', req.ip, `Rate limit exceeded: ${req.method} ${req.url}`);
        res.status(options.statusCode).send(options.message);
    }
});
app.use(limiter);

// Standard Middleware
app.use(express.json({ limit: '10kb' })); // Body limit to prevent DOS
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/admin'));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log internally
    res.status(500).json({ error: 'Something went wrong!' }); // Generic error to user
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
