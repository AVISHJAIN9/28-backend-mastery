# 07 - PDF Generation with Puppeteer & PDFKit

## Overview

Learn PDF generation from HTML and templates using Puppeteer and PDFKit.

## API Endpoints

### Generate PDF from Template
```
POST /api/pdf/template
body: { "title": "My Document", "content": "...", "author": "Name" }
```

### Generate Invoice
```
POST /api/pdf/invoice
body: { "invoiceNumber": "INV-001", "items": [...], "total": 299.99 }
```

## PDFKit Methods

- `text()`: Add text to document
- `fontSize()`: Set font size
- `moveTo()`: Move drawing cursor
- `lineTo()`: Draw lines
- `rect()`: Draw rectangles
- `image()`: Add images
- `table()`: Create tables

## Use Cases

- Invoices and receipts
- Certificates
- Reports
- Contracts
- Marketing materials

## Best Practices

✅ Validate input before processing
✅ Set reasonable timeouts
✅ Cache templates
✅ Monitor server resources

## Learn More

- [theory.md](theory.md)
- [PDFKit Docs](http://pdfkit.org/)
- [Puppeteer Docs](https://pptr.dev/)

## Next Module

[08 - File Validation](../08-file-type-validation-magic-bytes/)
