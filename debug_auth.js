const axios = require('axios');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const cookieJar = new tough.CookieJar();
const client = wrapper(axios.create({ jar: cookieJar }));

const API_URL = 'http://localhost:3000/api/auth';

async function testLogin() {
    console.log('🔍 Testing Login Flow...');

    // 1. Register a test user (ignore error if exists)
    try {
        await client.post(`${API_URL}/register`, {
            username: 'debug_user',
            email: 'debug@example.com',
            password: 'password123'
        });
        console.log('✅ Registration: OK (or already exists)');
    } catch (e) {
        if (e.response && e.response.status !== 400) {
            console.log('❌ Registration Error:', e.message);
        } else {
            console.log('ℹ️ User likely already exists.');
        }
    }

    // 2. Login
    try {
        const res = await client.post(`${API_URL}/login`, {
            email: 'debug@example.com',
            password: 'password123'
        });

        console.log(`✅ Login Status: ${res.status}`);
        const cookies = await cookieJar.getCookies(API_URL);
        console.log('🍪 Cookies received:', cookies.map(c => c.key));

        if (cookies.some(c => c.key === 'token')) {
            console.log('✅ Authentication Token Cookie found!');
        } else {
            console.error('❌ FAILURE: No token cookie received!');
        }

    } catch (e) {
        console.error('❌ Login Failed:', e.response ? e.response.data : e.message);
    }
}

testLogin();
