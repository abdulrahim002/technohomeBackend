// test-ai.js
require('dotenv').config();
const visionService = require('./src/services/visionService');

async function testOCR() {
  try {
    // يمكنك استبدال هذا الرابط برابط صورة تحتوي على كود عطل بشكل مباشر (يُفضل أن ينتهي بـ .jpg أو .png)
    // هنا قمت بوضع رابط افتراضي لتجربة الكود، تأكد من استبداله بصورة توضح رمز الايرور
    const testImageUrl = "./test1.jpg"
    
    console.log('Sending image to Local Tesseract OCR...');
    const result = await visionService.analyzeErrorImage(testImageUrl);
    
    console.log('=== AI Result ===');
    console.log(result);
  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

testOCR();
