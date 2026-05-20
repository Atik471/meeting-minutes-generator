# Meeting Minutes Generator - Audio to MOM Platform

End-to-end automation platform for converting meeting audio recordings into professional Minutes of Meeting documents using Deepgram Nova-3 for transcription and Gemini 2.5 Flash for summarization.

## Project Structure

```
meeting-minutes-generator/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── index.js      # Server entry point
│   │   ├── routes/       # API routes
│   │   └── utils/        # Helper functions
│   └── package.json
├── frontend/             # React dashboard
│   ├── src/
│   ├── public/
│   └── package.json
├── prompt.txt            # System prompt for MOM generation
├── .env                  # Environment variables (API keys)
└── README.md
```

## Phase 1: Environment Setup & Infrastructure ✅

### Setup Instructions

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env` (already done)
   - Add your API keys:
     - `DEEPGRAM_API_KEY`: Get from https://console.deepgram.com
     - `GEMINI_API_KEY`: Get from https://aistudio.google.com

4. **Verify Installation**
   ```bash
   # Backend
   cd backend && npm list | grep -E "@deepgram|@google|multer"
   
   # Frontend
   cd frontend && npm list | grep -E "react-markdown|lucide-react"
   ```

## Key Dependencies

### Backend
- **@deepgram/sdk**: Speech-to-text transcription
- **@google/generative-ai**: Gemini API for MOM generation
- **express**: HTTP server framework
- **multer**: File upload handling (supports up to 100MB audio)
- **dotenv**: Environment variable management
- **cors**: Cross-origin resource sharing

### Frontend
- **react**: UI framework
- **react-markdown**: Markdown rendering for MOM output
- **lucide-react**: Icon components
- **canvas-confetti**: Success state animations
- **axios**: HTTP client for API calls

## Next Steps

- **Phase 2**: Implement backend API route `POST /api/transcribe`
- **Phase 3**: Build React dashboard with drag-and-drop, configuration panel, and dual-panel output

## API Architecture

```
Audio File Upload (Frontend)
         ↓
  POST /api/transcribe
         ↓
  Deepgram Nova-3 (Transcription with speaker diarization)
         ↓
  Text Processing & Formatting
         ↓
  Gemini 2.5 Flash (MOM Generation)
         ↓
  Return: { transcript, mom }
         ↓
  Display in Dashboard + Export Options
```

---
Last updated: 2026-05-20
