const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  phone: '0987654321',
  password: 'password123',
  role: 'customer'
};

async function testAuthFlow() {
  console.log('🚀 Starting Auth Flow Test...');

  try {
    // 1. Register
    console.log('\n--- 1. Testing Registration ---');
    try {
      const regRes = await axios.post(`${API_URL}/register`, testUser);
      console.log('✅ Registration Success:', regRes.data.message);
    } catch (err) {
      if (err.response && err.response.data.message === 'رقم الهاتف مستخدم بالفعل') {
        console.log('ℹ️ User already exists, proceeding to login...');
      } else {
        throw err;
      }
    }

    // 2. Login
    console.log('\n--- 2. Testing Login ---');
    const loginRes = await axios.post(`${API_URL}/login`, {
      phone: testUser.phone,
      password: testUser.password
    });
    console.log('✅ Login Success. Token:', loginRes.data.data.token.substring(0, 10) + '...');

    // 3. Forgot Password
    console.log('\n--- 3. Testing Forgot Password (Phone-based) ---');
    const forgotRes = await axios.post(`${API_URL}/forgot-password`, {
      phone: testUser.phone
    });
    console.log('✅ Forgot Password Success:', forgotRes.data.message);
    console.log('⚠️ CHECK SERVER LOGS FOR THE RESET TOKEN TO PROCEED WITH TEST 4');

    } catch (error) {
    if (error.response) {
      console.error('❌ Test Failed (Response):', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Test Failed (Message):', error.message);
    }
  }
}

testAuthFlow();
