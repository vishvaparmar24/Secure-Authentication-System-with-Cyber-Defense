const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/admin';

async function testAdminApi() {
    console.log('🔍 Testing Admin API...\n');

    try {
        console.log('1. Fetching Stats...');
        const stats = await axios.get(`${BASE_URL}/stats`);
        console.log('✅ Stats:', stats.data);
    } catch (err) {
        console.error('❌ Stats Failed:', err.message, err.response?.data);
    }

    try {
        console.log('\n2. Fetching Events...');
        const events = await axios.get(`${BASE_URL}/events`);
        console.log(`✅ Events: Found ${events.data.length} items`);
    } catch (err) {
        console.error('❌ Events Failed:', err.message);
    }

    try {
        console.log('\n3. Fetching Risk Users...');
        const users = await axios.get(`${BASE_URL}/risk-users`);
        console.log(`✅ Risk Users: Found ${users.data.length} items`);
    } catch (err) {
        console.error('❌ Risk Users Failed:', err.message);
    }
}

testAdminApi();
