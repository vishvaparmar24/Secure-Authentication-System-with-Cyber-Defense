require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log('🔄 Starting Database Upgrade...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true // validation
        });

        const sql = fs.readFileSync(path.join(__dirname, 'database_upgrade.sql'), 'utf8');

        console.log('📜 Executing SQL script...');
        await connection.query(sql); // execute script

        console.log('✅ Database upgraded successfully!');
        console.log('   - Added tables: user_risk_scores, blocked_ips, login_devices');
        console.log('   - Upgraded table: security_logs');

        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
        process.exit(1);
    }
}

migrate();
