const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');

class ReportExportService {
  /**
   * تصدير سجل معاملات المحفظة إلى ملف Excel
   */
  async exportWalletToExcel(userId) {
    const user = await User.findById(userId);
    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Wallet Statement');

    // إعداد العواميد
    worksheet.columns = [
      { header: 'التاريخ', key: 'date', width: 20 },
      { header: 'النوع', key: 'type', width: 15 },
      { header: 'القيمة', key: 'amount', width: 15 },
      { header: 'الرصيد بعد العملية', key: 'balance', width: 20 },
      { header: 'الوصف', key: 'description', width: 40 }
    ];

    // إضافة البيانات
    transactions.forEach(t => {
      worksheet.addRow({
        date: t.createdAt.toLocaleString('ar-LY'),
        type: t.type === 'credit' ? 'شحن' : (t.type === 'debit' ? 'خصم' : 'إرجاع'),
        amount: `${t.amount} د.ل`,
        balance: `${t.balanceAfter} د.ل`,
        description: t.description
      });
    });

    // تنسيق الهيدر
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    return workbook;
  }

  /**
   * توليد تقرير أداء الفني بصيغة PDF
   * (يمكن توسيعه ليشمل التقييمات وعدد المهام)
   */
  async generateTechnicianPDFReport(techId) {
    // هذه وظيفة هيكلية يمكن ملؤها لاحقاً ببيانات معقدة
    const doc = new PDFDocument();
    // ... logic for PDF ...
    return doc;
  }
}

module.exports = new ReportExportService();
