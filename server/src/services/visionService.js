const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Troubleshoot = require('../models/Troubleshoot.model');

// حساب المسافة البسيطة (Levenshtein Distance) للمقارنة المرنة
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

exports.analyzeErrorImage = async (imagePath) => {
  try {
    let imageBuffer;
    
    if (typeof imagePath === 'string') {
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        const response = await fetch(imagePath);
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        const absolutePath = path.resolve(imagePath);
        imageBuffer = fs.readFileSync(absolutePath);
      }
    } else if (Buffer.isBuffer(imagePath)) {
      imageBuffer = imagePath;
    }

    const processedImageBuffer = await sharp(imageBuffer)
      .grayscale()
      .linear(1.5, -(128 * 0.5)) 
      .threshold(128)
      .toBuffer();

    const { data: { text, confidence } } = await Tesseract.recognize(
      processedImageBuffer,
      'eng'
    );

    if (!text || text.trim() === '') {
      return { confidence: 0, text: '', extractedErrorCode: null, suggestedProblem: 'لم يتم التعرف على أي نص في الصورة' };
    }

    const confidenceLevel = (confidence / 100) || 0;

    // 1. جلب الكلمات وتنقيتها
    const words = text.split(/\s+/).map(w => w.replace(/[^A-Za-z0-9]/g, '').toUpperCase()).filter(w => w.length > 0);

    // 2. محاولة جلب الأكواد من قاعدة البيانات
    let knownCodes = ['PE', 'OE', 'UE', 'DE', 'IE', 'E1', 'F4']; // أكواد افتراضية
    if (mongoose.connection.readyState === 1) {
      try {
        const troubleshoots = await Troubleshoot.find({ isActive: true }, 'errorCode').lean();
        if (troubleshoots.length > 0) {
          knownCodes = [...new Set([...knownCodes, ...troubleshoots.map(t => t.errorCode.toUpperCase())])];
        }
      } catch(e) { console.error('DB fetch error', e); }
    }

    // 3. البحث بالمنطق الهجين (Fuzzy Search) والتطابق الحاد
    let bestMatch = null;
    let minDistance = 999;

    for (const known of knownCodes) {
      for (const word of words) {
        if (word === known) {
          bestMatch = known;
          minDistance = 0;
          break;
        }
        // مقارنة مرنة بهامش خطأ 1 حرف
        const d = levenshtein(word, known);
        if (d < minDistance && d <= 1 && known.length >= 2 && word.length >= 2) {
          bestMatch = known;
          minDistance = d;
        }
      }
      if (minDistance === 0) break;
    }

    // 4. منطق P, B, E كبديل (كود مكون من حرفين أو ثلاثة يبدأ بهذه الأحرف)
    let potentialCode = null;
    if (!bestMatch) {
      const matchRegex = /\b[PBE][A-Z0-9]{1,2}\b/i;
      const match = text.match(matchRegex);
      if (match) {
        potentialCode = match[0].toUpperCase();
      }
    }

    const finalCode = bestMatch || potentialCode;

    // 5. اتخاذ القرار واستخراج الرسالة الذكية
    let suggestedProblem = '';
    
    if (finalCode) {
      if (minDistance === 0 && confidenceLevel > 0.4) {
        suggestedProblem = `تم التعرف بدقة على كود العطل: ${finalCode}`;
      } else {
        suggestedProblem = `هل يظهر لك كود ${finalCode} على الشاشة؟ جرب تأكيده أو كتابته يدوياً.`;
      }
    } else {
      suggestedProblem = 'تم استخراج نصوص ولكن لم يُعثر على رمز عطل واضح';
    }

    return {
      confidence: confidenceLevel,
      text: text.trim(),
      extractedErrorCode: finalCode,
      suggestedProblem
    };
  } catch (error) {
    console.error('Tesseract OCR Error:', error);
    throw new Error('حدث خطأ أثناء معالجة الصورة عبر نظام Tesseract المحلي');
  }
};
