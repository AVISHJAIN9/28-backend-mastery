# Speech-to-Text & Text-to-Speech

## What is this?

AI-powered voice services:
- **Speech Recognition**: Convert audio (MP3, WAV, OGG) to text
- **Text-to-Speech**: Convert text to natural-sounding audio
- **Language Support**: 125+ languages and regional accents
- **Real-time Transcription**: Streaming audio transcription
- **Speaker Identification**: Detect which person spoke (diarization)
- **Sentiment Detection**: Analyze tone and emotion in voice
- **Custom Vocabularies**: Improve accuracy for domain-specific terms

## Why does it matter?

Voice interaction increases accessibility for users with disabilities, enables hands-free operation, and improves user engagement. Voice search adoption grows 20% annually. Customer support call recording with transcription improves compliance and enables coaching.

## How it works (step by step)

1. **Audio Upload**: POST `/api/voice/upload` with MP3/WAV file
2. **Validation**: Check format, duration (max 5 hours), size (max 100MB)
3. **Transcription Job**: Async processing of audio to text
4. **Polling Status**: GET `/api/voice/jobs/:id` to check progress
5. **Transcript Ready**: Webhook notifies when transcription complete
6. **Store Transcript**: Save to database, index for search
7. **Text-to-Speech**: POST `/api/voice/synthesize` with text
8. **Generate Audio**: AI generates audio file in requested language/voice
9. **Return Audio URL**: Client downloads MP3 or plays directly

## Key concepts

- **Audio Formats**: Support WAV, MP3, OGG, FLAC, M4A
- **Sample Rate**: 16kHz minimum (44.1kHz recommended)
- **Async Processing**: Large files processed async with webhook callback
- **Caching Uploads**: Deduplicate audio, cache transcriptions
- **Speaker Diarization**: Identify multiple speakers ("Speaker 1", "Speaker 2")
- **Custom Vocabularies**: Add company names, medical terms to improve accuracy
- **Regional Accents**: Select accent (British English, Australian English, etc.)

## Common mistakes

1. **Uploading unsupported format** → Transcription fails silently → Validate format before upload
2. **Audio too compressed** → Accuracy drops below 80% → Use minimum 16kHz sample rate
3. **Waiting for sync response** → Blocks request for 5+ minutes → Use async with webhooks
4. **No speaker identification** → Can't attribute quotes to person → Enable diarization
5. **Text-to-speech with special characters** → Audio glitches → Sanitize input
6. **Not caching transcriptions** → Same audio processed twice, double cost → Cache MD5 of audio

## Real world usage

**Voicemail to Email**: Phone service records voicemail → sent to speech-to-text → transcript emailed
**Customer Support**: Call recorded → transcribed automatically → searchable transcript → reviewed by QA
**Accessibility**: Article has TTS link → click to hear it read → enables hands-free browsing
**Meeting Notes**: Zoom recording → transcribed → highlights, action items extracted → shared with attendees
**Voice Search**: User says "Find restaurants near me" → speech-to-text → processed as query

## API Endpoints

### Speech Recognition
- `POST /api/voice/upload` - Upload audio file
- `GET /api/voice/jobs/:id` - Check transcription status
- `GET /api/voice/transcript/:id` - Get completed transcript
- `DELETE /api/voice/:id` - Delete audio file

### Text-to-Speech
- `POST /api/voice/synthesize` - Generate audio from text
- `GET /api/voice/audio/:id` - Download generated audio

### Management
- `GET /api/voice/languages` - List supported languages
- `GET /api/voice/voices` - List available voices and accents

## Quick Start

```bash
npm install
node server.js
# Running on http://localhost:6310
```

## Testing

```bash
# Upload audio file
curl -X POST http://localhost:6310/api/voice/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@recording.wav"

# Check transcription status
curl http://localhost:6310/api/voice/jobs/job-123 \
  -H "Authorization: Bearer {token}"

# Generate speech from text
curl -X POST http://localhost:6310/api/voice/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text":"Hello, this is a test",
    "language":"en-US",
    "voice":"female"
  }'
```
