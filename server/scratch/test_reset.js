const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';
const phone = '0987654321';
const otp = '123456'; // Update this with the code from the server console!
const newPassword = 'finalPassword789';

async function testOTPResetFlow() {
  console.log('🚀 Starting OTP Reset Password Test...');

  try {
    // 4. Reset Password via OTP
    console.log('\n--- 4. Testing Reset Password via OTP ---');
    const resetRes = await axios.post(`${API_URL}/reset-password-otp`, {
      phone: phone,
      otp: otp,
      password: newPassword
    });
    console.log('✅ OTP Reset Success:', resetRes.data.message);

    // 5. Login with NEW Password
    console.log('\n--- 5. Testing Login with New Password ---');
    const loginRes = await axios.post(`${API_URL}/login`, {
      phone: phone,
      password: newPassword
    });
    console.log('✅ Login Success. Token:', loginRes.data.data.token.substring(0, 10) + '...');

  } catch (error) {
    console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
  }
}

testOTPResetFlow();
