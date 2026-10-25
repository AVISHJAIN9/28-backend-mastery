# Setup - PDF Generation

## Prerequisites

- Node.js 18+
- npm or yarn
- Optional: Puppeteer (for HTML conversion)

## Installation

### 1. Install Dependencies
```bash
cd 07-pdf-generation-puppeteer-pdfkit
npm install
```

Puppeteer auto-downloads Chromium (~150MB)

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Create Temp Directory
```bash
mkdir -p /tmp/pdfs
chmod 755 /tmp/pdfs
```

### 4. Start Server
```bash
npm start
```

Server runs on http://localhost:6607

## Testing

### Generate PDF from Template
```bash
curl -X POST http://localhost:6607/api/pdf/template \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My Document",
    "content": "This is test content",
    "author": "John Doe"
  }' \\
  --output document.pdf
```

### Generate Invoice
```bash
curl -X POST http://localhost:6607/api/pdf/invoice \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoiceNumber": "INV-001",
    "items": [{"name": "Product", "price": 99.99}],
    "total": 99.99
  }' \\
  --output invoice.pdf
```

## Troubleshooting

### Puppeteer Issues
```bash
npm rebuild puppeteer
```

### Permission Denied
```bash
sudo chmod 755 /tmp/pdfs
```

### Memory Issues
```bash
node --max-old-space-size=2048 server.js
```

## Next Steps

1. Test PDF generation
2. Create templates
3. [Module 08 - File Validation](../08-file-type-validation-magic-bytes/)
