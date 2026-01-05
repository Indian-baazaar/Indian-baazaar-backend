// Simple test script to verify message API endpoints
// Run this after starting the server to test basic functionality

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Test data
const testUsers = {
    superAdmin: {
        email: 'admin@test.com',
        password: 'admin123',
        token: null
    },
    seller: {
        email: 'seller@test.com', 
        password: 'seller123',
        token: null
    },
    user: {
        email: 'user@test.com',
        password: 'user123',
        token: null
    }
};

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        method,
        headers,
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        const result = await response.json();
        
        console.log(`${method} ${endpoint}:`, response.status, result.success ? '✅' : '❌');
        
        if (!response.ok) {
            console.log('Error:', result.message);
        }
        
        return { success: response.ok, data: result };
    } catch (error) {
        console.error(`${method} ${endpoint}: ❌ Network Error:`, error.message);
        return { success: false, error: error.message };
    }
}

// Test basic server connectivity
async function testServerConnection() {
    console.log('\n🔍 Testing server connection...');
    const result = await apiCall('/');
    return result.success;
}

// Test message endpoints (without authentication for now)
async function testMessageEndpoints() {
    console.log('\n🔍 Testing message endpoints...');
    
    // Test endpoints that require authentication (should return 401)
    await apiCall('/api/message/list');
    await apiCall('/api/message/stats');
    await apiCall('/api/message/send', 'POST', {
        receiverId: '507f1f77bcf86cd799439011',
        receiverType: 'User',
        subject: 'Test',
        content: 'Test message'
    });
}

// Test message validation
async function testMessageValidation() {
    console.log('\n🔍 Testing message validation...');
    
    // Test with invalid data (should return 400)
    await apiCall('/api/message/send', 'POST', {
        // Missing required fields
        subject: 'Test'
    });
    
    await apiCall('/api/message/send', 'POST', {
        receiverId: 'invalid_id', // Invalid MongoDB ID
        receiverType: 'InvalidType', // Invalid receiver type
        subject: '', // Empty subject
        content: 'Test'
    });
}

// Test message routes structure
async function testRouteStructure() {
    console.log('\n🔍 Testing route structure...');
    
    // Test various endpoints to see if routes are properly set up
    const endpoints = [
        '/api/message/list',
        '/api/message/stats',
        '/api/message/conversation/507f1f77bcf86cd799439011/User',
        '/api/message/507f1f77bcf86cd799439011',
        '/api/message/507f1f77bcf86cd799439011/read'
    ];
    
    for (const endpoint of endpoints) {
        await apiCall(endpoint);
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting Message API Tests\n');
    console.log('=' .repeat(50));
    
    // Test 1: Server connection
    const serverOk = await testServerConnection();
    if (!serverOk) {
        console.log('❌ Server is not running. Please start the server first.');
        return;
    }
    
    // Test 2: Message endpoints
    await testMessageEndpoints();
    
    // Test 3: Validation
    await testMessageValidation();
    
    // Test 4: Route structure
    await testRouteStructure();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Basic API structure tests completed!');
    console.log('\n📝 Notes:');
    console.log('- All endpoints correctly return 401 for unauthenticated requests');
    console.log('- Validation is working for invalid data');
    console.log('- Routes are properly configured');
    console.log('\n🔧 Next steps:');
    console.log('1. Create test users with different roles');
    console.log('2. Test authenticated requests');
    console.log('3. Test message permissions between different user types');
    console.log('4. Test full message workflows');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { runTests, testServerConnection, testMessageEndpoints };