const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testReminderProcessing() {
    try {
        console.log('🧪 Testing reminder processing...');
        
        // Test the cron endpoint
        const response = await axios.post(`${API_BASE_URL}/api/cron/process-reminders`);
        
        console.log('✅ Reminder processing test successful!');
        console.log('Response:', response.data);
        
    } catch (error) {
        console.error('❌ Reminder processing test failed!');
        if (error.response) {
            console.error('Error response:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function testCronHealth() {
    try {
        console.log('🏥 Testing cron service health...');
        
        const response = await axios.get(`${API_BASE_URL}/api/cron/health`);
        
        console.log('✅ Cron health check successful!');
        console.log('Response:', response.data);
        
    } catch (error) {
        console.error('❌ Cron health check failed!');
        if (error.response) {
            console.error('Error response:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting reminder system tests...\n');
    
    await testCronHealth();
    console.log('');
    
    await testReminderProcessing();
    console.log('');
    
    console.log('✨ All tests completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testReminderProcessing, testCronHealth };
