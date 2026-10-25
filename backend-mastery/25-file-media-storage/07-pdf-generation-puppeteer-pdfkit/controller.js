const PDFDocument = require('pdfkit');
const crypto = require('crypto');

const generatePdfFromTemplate = async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const doc = new PDFDocument();
    
    doc.fontSize(16).text(title || 'Document', 100, 100);
    doc.fontSize(12).text(content || 'No content provided', 100, 150);
    doc.fontSize(10).text(`Author: ${author || 'Anonymous'}`, 100, 300);
    doc.text(`Generated: ${new Date().toISOString()}`, 100, 320);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const { invoiceNumber, items, total } = req.body;
    const doc = new PDFDocument();
    
    doc.fontSize(20).text('INVOICE', 100, 100);
    doc.fontSize(12).text(`Invoice #${invoiceNumber}`, 100, 150);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 100, 170);
    
    if (Array.isArray(items)) {
      doc.fontSize(10).text('Items:', 100, 220);
      items.forEach((item, i) => {
        doc.text(`${item.name}: $${item.price}`, 120, 240 + (i * 20));
      });
    }
    
    doc.fontSize(12).text(`Total: $${total || 0}`, 100, 350);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const healthCheck = (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: '07 PDF Generation',
    formats: ['template', 'invoice', 'certificate']
  });
};

module.exports = { generatePdfFromTemplate, generateInvoice, healthCheck };
