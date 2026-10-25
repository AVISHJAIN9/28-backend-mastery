# Speech Recognition & TTS: Theory & Concepts

## 1. Speech-to-Text (Automatic Speech Recognition)

### Audio Processing
```
Raw audio waveform
  ↓ (Fourier Transform)
Frequency spectrogram (visual representation)
  ↓ (Feature extraction - MFCCs)
Robust features for recognition
  ↓ (Neural network)
Transcription text
```

### Accuracy by Audio Quality
```
Studio quality (16 kHz, noise-free): 95%+ accuracy
Phone call (8 kHz, compressed): 85-90% accuracy
Street noise (loud background): 70-80% accuracy
For poor audio, consider speech enhancement preprocessing
```

### Async vs Real-time
**Batch (offline)**:
- Upload 1-5 hour audio files
- Returns transcript in minutes
- Cheaper per request
- Used for: Voicemail transcription, meeting notes

**Real-time (streaming)**:
- Continuous audio stream
- Returns partial results as speaking
- More expensive
- Used for: Live captions, voice chat

## 2. Speaker Diarization

### Identifying Multiple Speakers
```
Audio: "Hi Alice. Hi Bob. How are you?"

Without diarization:
"Hi Alice. Hi Bob. How are you?"
(Can't tell who said what)

With diarization:
SPEAKER_1: "Hi Alice."
SPEAKER_2: "Hi Bob."
SPEAKER_1: "How are you?"
(Clear attribution)
```

### How It Works
1. Detect speaker changes (voice characteristic shifts)
2. Segment audio into speaker blocks
3. Label each block (Speaker 1, Speaker 2, etc.)
4. Optional: Match to speaker (if pre-registered voices available)

**Accuracy**: 70-85% for 2-3 speakers, drops with more speakers

## 3. Custom Vocabularies

### Domain-Specific Accuracy
```
Generic model: "patient has..." (medical context misheard)
Medical vocabulary model: "patient has appendectomy" (correct)

Finance: "two million dollars"
Generic: Might transcribe as "to million dollars"
Finance model: "2M" correctly
```

### Training Custom Models
```
1. Collect domain-specific audio samples (100+ hours)
2. Manual transcription of samples
3. Train model on domain data
4. Accuracy improves 10-30% vs generic
```

## 4. Text-to-Speech (TTS)

### Voice Synthesis Methods
**Concatenative**:
- Pre-record all phonemes
- Concatenate to form words
- Natural but limited variety

**Parametric**:
- Generate audio parameters from text
- More flexible
- Less natural (robotic)

**Neural (Deep Learning)**:
- Train neural network on human speech
- Natural-sounding
- Supports emotion/tone variation
- Used by Google, Amazon, Apple

### Supported Languages
```
Google Cloud TTS: 220+ voices in 40 languages
AWS Polly: 29 languages, 100+ voices
Azure Speech: 140+ voices in 70+ languages
```

**Note**: Quality varies by language (English > Japanese > Swahili)

## 5. Privacy & Security

### Audio Data Handling
**Sensitive information in audio**:
- Medical records (doctor's notes)
- Legal depositions (attorney-client privileged)
- Financial calls (account numbers, SSN)
- Passwords (users might say them)

**Risk**: Audio sent to cloud = potential exposure

**Protection**:
- Encrypt audio in transit (HTTPS)
- Use private endpoints (VPC, no internet routing)
- Delete audio after transcription (max 30 days)
- Mask sensitive data in transcripts

### HIPAA Compliance
For healthcare audio:
- Use HIPAA-eligible provider (AWS, Google Cloud)
- Sign Business Associate Agreement (BAA)
- Encrypt audio and transcripts
- Audit trail of all access
- User consent before recording

## 6. Bias in Speech Recognition

### Demographic Bias
```
Generic model trained on American English:
- White male speakers: 90% accuracy
- Black female speakers: 75% accuracy
- Non-native speakers: 70% accuracy

Cause: Training data imbalance
Fix: Include diverse speakers in training data
```

### Accent Variation
```
British English "schedule": "sching" sound
American English: "skej" sound

Model trained only on American:
- British accent = lower accuracy (20%)

Solution: Specify accent/language in API
Different model = higher accuracy
```

## 7. Security Checklist

- [ ] Audio encrypted in transit (HTTPS/TLS)
- [ ] Audio stored encrypted at rest
- [ ] Audio deleted after processing (< 30 days)
- [ ] PII not extracted to plaintext
- [ ] HIPAA-eligible service for healthcare
- [ ] User consent captured before recording
- [ ] Audit trail of transcription access
- [ ] Rate limiting on API (max 10/user/day)
- [ ] Async processing (don't expose internal state)
- [ ] Error messages generic (don't leak speaker names)
- [ ] Testing for accent bias
- [ ] Custom vocabulary for domain accuracy
