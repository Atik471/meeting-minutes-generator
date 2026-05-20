# Phase 2: Backend API Implementation ✅

## What Was Implemented

### 1. **Transcription Route** ([backend/src/transcribeRoute.js](backend/src/transcribeRoute.js))
- **Endpoint**: `POST /api/transcribe`
- Handles audio file uploads (supports mp3, wav, m4a, ogg, webm)
- File size limit: 100MB
- Returns both transcript and generated MOM

### 2. **Utility Functions** ([backend/src/utils.js](backend/src/utils.js))
- `formatTranscript()` - Converts Deepgram output to speaker-labeled text
- `validateAudioFile()` - Validates file type and size
- `loadSystemPrompt()` - Loads your system prompt from `prompt.txt`

### 3. **Server Integration** ([backend/src/index.js](backend/src/index.js))
- Integrated transcribe route
- Health check endpoint for verification
- Error handling middleware
- CORS enabled for frontend communication

---

## Processing Pipeline

```
Audio Upload (Frontend)
    ↓
POST /api/transcribe
    ↓
Deepgram Nova-3 (Transcription + Speaker Diarization)
    ├─ Speakers detected automatically
    ├─ Smart formatting applied
    └─ Filler words removed
    ↓
Format Transcript (Backend Utility)
    ├─ Extract speaker information
    ├─ Label each speaker block
    └─ Return formatted text
    ↓
Gemini 2.5 Flash (MOM Generation)
    ├─ Uses your system prompt from prompt.txt
    ├─ Applies temperature setting (0.2 default = strict/analytical)
    └─ Returns structured MOM document
    ↓
Response to Frontend
    ├─ Formatted transcript
    ├─ Generated MOM (Markdown)
    ├─ Metadata (language, temperature, timestamp)
    └─ Success status
```

---

## API Endpoint Documentation

### POST /api/transcribe

**Request** (multipart/form-data):
```
Field: audio (File) - Required
  - Type: Audio file
  - Supported: mp3, wav, m4a, ogg, webm
  - Max size: 100MB

Field: language (String) - Optional
  - Default: "en" (English)
  - Options: "en" (English), "bn" (Bengali), "es" (Spanish), etc.

Field: temperature (Float) - Optional
  - Default: 0.2
  - Range: 0.0 (strict) to 1.0 (creative)
  - Affects MOM prose variation

Field: customPrompt (String) - Optional
  - Custom system instruction for Gemini
  - If not provided, uses prompt.txt
```

**Response** (Success 200):
```json
{
  "success": true,
  "transcript": "[Speaker 0]: Hello everyone. [Speaker 1]: Hi there...",
  "mom": "# Minutes of Meeting\n\n## Executive Summary...",
  "metadata": {
    "language": "en",
    "temperature": 0.2,
    "audioSize": 5242880,
    "timestamp": "2026-05-20T10:30:00.000Z"
  }
}
```

**Response** (Error 400/422/500):
```json
{
  "error": "Error description"
}
```

---

## Configuration & Testing

### 1. Add Your API Keys

Edit `.env` file:
```
DEEPGRAM_API_KEY=your_deepgram_key_here
GEMINI_API_KEY=your_gemini_key_here
PORT=5000
NODE_ENV=development
REACT_APP_API_BASE_URL=http://localhost:5000
```

**Get your keys:**
- Deepgram: https://console.deepgram.com/signup
- Gemini: https://aistudio.google.com/app/apikey

### 2. Start the Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
Meeting Minutes Backend Server running on http://localhost:5000
Health Check: http://localhost:5000/health
API Endpoint: POST http://localhost:5000/api/transcribe
```

### 3. Test the Server

**Health Check**:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"ok","message":"Backend server is running"}
```

**Test Transcription Endpoint** (with audio file):
```bash
curl -X POST http://localhost:5000/api/transcribe \
  -F "audio=@/path/to/meeting.mp3" \
  -F "language=en" \
  -F "temperature=0.2"
```

---

## File Structure

```
backend/
├── src/
│   ├── index.js              # Main server file
│   ├── transcribeRoute.js    # Transcription endpoint
│   └── utils.js              # Helper functions
├── node_modules/             # Dependencies
└── package.json
```

---

## Key Features Implemented

✅ **Multi-format Audio Support**: mp3, wav, m4a, ogg, webm  
✅ **Speaker Diarization**: Automatic speaker identification and labeling  
✅ **Smart Formatting**: Punctuation, capitalization, paragraph layouts  
✅ **System Prompt Integration**: Loads from your `prompt.txt` file  
✅ **Error Handling**: Comprehensive error messages and validation  
✅ **Metadata Tracking**: Returns language, temperature, audio size, timestamp  
✅ **File Size Protection**: 100MB limit to prevent memory issues  
✅ **Production-Ready**: CORS, error middleware, environment variables  

---

## Next Steps: Phase 3

- Build React frontend dashboard
- Implement drag-and-drop file zone
- Create configuration panel (language, temperature, custom prompt)
- Build dual-panel output display
- Add export controls (copy, download as MD, download as TXT)

---

**Status**: Phase 2 Complete ✅  
**Last Updated**: 2026-05-20  
**Ready for**: Phase 3 Frontend Development
