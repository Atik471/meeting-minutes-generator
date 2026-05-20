# 🚀 Quick Start Guide - Phase 2 Complete

## What You Have Now

✅ **Backend API Ready** - Accepts audio files and returns transcript + MOM  
✅ **Deepgram Integration** - Automatic speaker detection and transcription  
✅ **Gemini Integration** - Professional MOM generation with your system prompt  
✅ **Error Handling** - Comprehensive validation and error messages  

---

## 3 Simple Steps to Test

### Step 1: Add Your API Keys

Edit `.env` file:
```
DEEPGRAM_API_KEY=paste_your_key_here
GEMINI_API_KEY=paste_your_key_here
```

**Get keys (free tier available)**:
- Deepgram: https://console.deepgram.com/signup
- Gemini: https://aistudio.google.com/app/apikey

### Step 2: Start Backend Server

```powershell
cd backend
npm run dev
```

Watch for: `Meeting Minutes Backend Server running on http://localhost:5000`

### Step 3: Test with Audio File

```powershell
# In PowerShell (new terminal)
$audioFile = "path\to\your\meeting.mp3"  # or .wav, .m4a, .ogg, .webm

$response = curl -X POST "http://localhost:5000/api/transcribe" `
  -F "audio=@$audioFile" `
  -F "language=en" `
  -F "temperature=0.2"

$response | ConvertFrom-Json | ConvertTo-Json | Write-Host
```

Or test with curl (if installed):
```bash
curl -X POST http://localhost:5000/api/transcribe \
  -F "audio=@meeting.mp3" \
  -F "language=en" \
  -F "temperature=0.2"
```

---

## What the API Returns

```json
{
  "success": true,
  "transcript": "[Speaker 0]: Hello... [Speaker 1]: Hi...",
  "mom": "# Minutes of Meeting\n\n## Executive Summary\n...",
  "metadata": {
    "language": "en",
    "temperature": 0.2,
    "audioSize": 5242880,
    "timestamp": "2026-05-20T10:30:00.000Z"
  }
}
```

---

## Request Parameters

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| audio | File | ✅ Yes | - | mp3, wav, m4a, ogg, webm (max 100MB) |
| language | String | ❌ No | "en" | Language code (en, bn, es, etc.) |
| temperature | Float | ❌ No | 0.2 | 0.0 (strict) to 1.0 (creative) |
| customPrompt | String | ❌ No | uses prompt.txt | Custom system instruction |

---

## Documentation Files

- **[PHASE_2_IMPLEMENTATION.md](PHASE_2_IMPLEMENTATION.md)** - Full technical documentation
- **[README.md](README.md)** - Project overview
- **[backend/src/transcribeRoute.js](backend/src/transcribeRoute.js)** - Main API endpoint
- **[backend/src/utils.js](backend/src/utils.js)** - Helper functions
- **[prompt.txt](prompt.txt)** - Your system prompt for MOM generation

---

## Files Created

```
backend/
├── src/
│   ├── index.js              ✅ Updated with routes
│   ├── transcribeRoute.js    ✅ NEW - Main endpoint
│   └── utils.js              ✅ NEW - Helper functions
└── node_modules/
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `DeepgramError: API key required` | Add DEEPGRAM_API_KEY to .env |
| `No file specified` or undefined API | Add GEMINI_API_KEY to .env |
| `ENOENT: no such file` | Run from backend directory |
| `Port already in use` | Change PORT in .env or kill process on 5000 |
| `Audio file not supported` | Use mp3, wav, m4a, ogg, or webm format |

---

## What's Next

**Phase 3**: React Frontend Dashboard
- Drag-and-drop file upload
- Configuration controls (language, temperature)
- Real-time processing status
- Dual-panel output display (transcript + MOM)
- Export buttons (copy, download MD, download TXT)

---

**Status**: Ready to Test! 🎉
