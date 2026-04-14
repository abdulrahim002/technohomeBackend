const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const arabicReshaper = require('arabic-persian-reshaper');
const rtlDetect = require('rtl-detect');

// Helper to reshape Arabic text for PDF
const reshape = (text) => {
  if (!text) return '';
  return arabicReshaper.reshape(text);
};

// Helper to handle RTL for PDF
const reverseText = (text) => {
  return text.split('').reverse().join('');
};

/**
 * Service to handle professional report generation
 */
class ReportService {
  /**
   * Generate an Excel file for any data set
   * @param {string} sheetName - Name of the worksheet
   * @param {Array} columns - Array of column definitions { header, key, width }
   * @param {Array} rows - Array of data rows
   */
  async generateExcel(sheetName, columns, rows) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;

    // Add rows
    worksheet.addRows(rows);

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    return workbook;
  }

  /**
   * Generate a PDF report with professional styling
   * @param {Object} reportData - { title, subtitle, headers, rows, filename }
   */
  async generatePDF(reportData, res) {
    const doc = new PDFDocument({ margin: 50 });

    // Stream the PDF to the response
    doc.pipe(res);

    // Font setup for Arabic support
    // We use Arial as it's common on Windows and supports Arabic glyphs
    const fontPath = 'C:\\Windows\\Fonts\\arial.ttf';
    try {
      doc.font(fontPath);
    } catch (e) {
      console.warn('Custom font not found, falling back to default PDF fonts. Arabic might not render correctly.');
    }

    // Branding / Header
    doc.fontSize(25).text('Techno Home 🏠', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text(reshape(reportData.title), { align: 'center' });
    doc.fontSize(12).text(reshape(reportData.subtitle), { align: 'center' });
    doc.moveDown();

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Draw Table
    const tableTop = doc.y;
    const itemCodeX = 50;
    const descriptionX = 150;
    const amountX = 450;

    // Headers
    doc.fontSize(12).font(fontPath || 'Helvetica-Bold');
    reportData.headers.forEach((header, i) => {
        const x = 50 + (i * 120);
        doc.text(reshape(header), x, tableTop);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Rows
    let currentY = doc.y;
    doc.font(fontPath || 'Helvetica');
    reportData.rows.forEach(row => {
        row.forEach((cell, i) => {
            const x = 50 + (i * 120);
            doc.text(reshape(String(cell)), x, currentY);
        });
        currentY += 20;

        // Add a new page if we're near the bottom
        if (currentY > 700) {
            doc.addPage();
            currentY = 50;
        }
    });

    // Footer
    doc.fontSize(10).text(
      `تم استخراج هذا التقرير آلياً من منصة تكنو هوم - ${new Date().toLocaleString('ar-EG')}`,
      50,
      750,
      { align: 'center' }
    );

    doc.end();
  }
}

module.exports = new ReportService();
