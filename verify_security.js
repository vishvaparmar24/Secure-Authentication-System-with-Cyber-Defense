const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/auth';

async function runTests() {
    console.log('🛡️ Starting Security Verification Tests...\n');

    // 1. Test SQL Injection
    console.log('🧪 Test 1: Simulating SQL Injection...');
    try {
        await axios.post(`${BASE_URL}/login`, {
            email: "' OR '1'='1",
            password: "password"
        });
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('✅ PASS: SQL Injection attempt rejected (401 Unauthorized).');
        } else {
            console.log(`❌ FAIL: Unexpected response status ${error.response ? error.response.status : error.message}`);
        }
    }

    // 2. Test Rate Limiting (Brute Force Simulation)
    console.log('\n🧪 Test 2: Simulating Brute Force (Rate Limit & Lockout)...');
    console.log('   Sending 6 invalid login attempts...');

    // Create a random email to avoid locking a real account during testing logic check, 
    // or use a specific test account if we want to test DB lockout.
    // Here we test the endpoint response.
    const testEmail = `test_attacker_${Date.now()}@example.com`;

    for (let i = 1; i <= 6; i++) {
        try {
            await axios.post(`${BASE_URL}/login`, {
                email: testEmail,
                password: "wrongpassword"
            });
            console.log(`   Attempt ${i}: Failed (Expected)`);
        } catch (error) {
            if (error.response) {
                console.log(`   Attempt ${i}: Status ${error.response.status} - ${error.response.data.message}`);
            }
        }
    }
    console.log('ℹ️ Note: If you see "Too many login attempts" or "Account is locked", the defense is working.');

    // 3. Test XSS Protection (Header Check)
    console.log('\n🧪 Test 3: Verifying HTTP Security Headers...');
    try {
        const res = await axios.get('http://localhost:3000/api/auth/check-session');
        const headers = res.headers;

        if (headers['x-dns-prefetch-control'] && headers['x-frame-options']) {
            console.log('✅ PASS: Helmet security headers are present.');
        } else {
            console.log('⚠️ WARN: Some security headers might be missing.');
        }
    } catch (error) {
        // Expected 401 if not logged in, but headers should still be there
        if (error.response) {
            const headers = error.response.headers;
            if (headers['x-dns-prefetch-control'] || headers['x-frame-options'] || headers['content-security-policy']) {
                console.log('✅ PASS: Helmet security headers are present (even on error).');
            }
        }
    }

    console.log('\n---------------------------------------------------');
    console.log('✅ Verification Complete. Check server logs for detailed audit trails.');
}

runTests();
