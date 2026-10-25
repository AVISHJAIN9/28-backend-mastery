# Setup Guide
## Dependencies
```bash
npm install multer
```
## Environment Variables
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
## How to run
```bash
mkdir uploads
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), handler);
node server.js
```
## How to test
```bash
curl -F "file=@photo.jpg" http://localhost:3000/upload
# File should be saved in uploads folder
```
