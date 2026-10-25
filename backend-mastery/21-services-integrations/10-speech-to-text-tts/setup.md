# Speech-to-Text & TTS Setup Guide

## Prerequisites

- Google Cloud account (for Speech-to-Text & TTS)
- OR AWS account (for Transcribe & Polly)
- Audio files for testing (.wav, .mp3, .ogg)
- Node.js 18.x or higher

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Setup Google Cloud

### Option A: Google Cloud Speech-to-Text

1. Go to Google Cloud Console
2. Create project
3. Enable APIs:
   - Cloud Speech-to-Text API
   - Cloud Text-to-Speech API
4. Create Service Account > Download key
5. Save as `google-credentials.json`

### Option B: AWS

1. Create IAM user with:
   - `TranscribeService` access
   - `PollyFullAccess`
2. Get Access Key ID and Secret

## Step 3: Create .env File

```bash
cp .env.example .env
```

```env
# For Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project
GOOGLE_CLOUD_CREDENTIALS_PATH=./google-credentials.json

# For AWS
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1

# General
SPEECH_PROVIDER=google
MAX_AUDIO_SIZE=104857600
HTTP_PORT=6310
```

## Step 4: Create Storage for Audio

Create `/uploads/audio` directory:
```bash
mkdir -p uploads/audio
echo "uploads/" >> .gitignore
```

## Step 5: Configure Async Processing

Setup job queue for large files:
```javascript
const Queue = require('bull');
const transcriptionQueue = new Queue('transcriptions', {
  redis: { host: '127.0.0.1', port: 6379 }
});
```

## Step 6: Setup Webhooks (Optional)

For async job completion:
```javascript
transcriptionQueue.on('completed', (job) => {
  notifyClient(job.data.userId, job.data.result);
});
```

## Step 7: Run Development Server

```bash
node server.js
# Server runs on http://localhost:6310
```

## How to test

```bash
# Upload audio file
curl -X POST http://localhost:6310/api/voice/upload \
  -H "Authorization: Bearer token" \
  -F "file=@recording.wav"

# Check transcription status
curl http://localhost:6310/api/voice/jobs/job-123 \
  -H "Authorization: Bearer token"

# Get transcript
curl http://localhost:6310/api/voice/transcript/job-123 \
  -H "Authorization: Bearer token"

# Text to speech
curl -X POST http://localhost:6310/api/voice/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text":"Hello world",
    "language":"en-US",
    "voice":"female"
  }'

# Get supported languages
curl http://localhost:6310/api/voice/languages

# List available voices
curl http://localhost:6310/api/voice/voices
```

## Verification Checklist

- [ ] Google Cloud or AWS configured
- [ ] API credentials in .env
- [ ] .gitignore excludes uploads/
- [ ] Server starts without errors
- [ ] Audio file uploads work
- [ ] Transcription jobs process
- [ ] Transcripts retrieved successfully
- [ ] Text-to-speech generates audio
- [ ] Webhook notifications working
- [ ] Supported languages list retrieved
