# 🎉 Meeting Minutes Generator - Complete Platform

## System Overview

```
Audio File (MP3, WAV, M4A, etc.)
           ↓
[React Frontend Dashboard]
  - Drag & drop upload
  - Language selection
  - Temperature control
  - Progress tracking
           ↓
[Express Backend API]
           ↓
[Deepgram Nova-3]
  - Speech-to-text
  - Speaker diarization
  - Smart formatting
           ↓
[Text Processing]
  - Speaker labeling
  - Transcript formatting
           ↓
[Gemini 2.5 Flash]
  - Professional MOM generation
  - Custom system prompt
  - Structured output
           ↓
[React Output Display]
  - Formatted transcript
  - Professional MOM (Markdown)
  - Export controls (Copy, MD, TXT)
```

---

## 🚀 Quick Start (5 Minutes)

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

### Terminal 2: Frontend
```bash
cd frontend
npm start
```

Visit **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
meeting-minutes-generator/
├── backend/
│   ├── src/
│   │   ├── index.js              ✅ Express server
│   │   ├── transcribeRoute.js    ✅ API endpoint
│   │   └── utils.js              ✅ Helper functions
│   ├── node_modules/
│   ├── package.json              ✅ Dependencies
│   └── .env                       ✅ API keys
│
├── frontend/
│   ├── public/
│   │   └── index.html            ✅ HTML template
│   ├── src/
│   │   ├── index.js              ✅ React entry
│   │   ├── index.css             ✅ Animations & theme
│   │   ├── App.jsx               ✅ Main component
│   │   └── components/
│   │       ├── FileUpload.jsx    ✅ Drag & drop
│   │       ├── ConfigPanel.jsx   ✅ Settings
│   │       ├── OutputPanel.jsx   ✅ Results
│   │       └── ProcessingStatus.jsx ✅ Progress
│   ├── node_modules/
│   └── package.json              ✅ Dependencies
│
├── .env                          ✅ Root env
├── .env.example
├── .gitignore
├── README.md
├── PHASE_1_SETUP.md
├── PHASE_2_IMPLEMENTATION.md
├── PHASE_3_FRONTEND.md
├── QUICK_START.md
└── prompt.txt                    ✅ MOM system prompt
```

---

## 🎨 Frontend Features

### Design
- **Dark theme** with animated gradients
- **Glassmorphism** effects
- **Grid background** pattern
- **3 animated gradient orbs** (purple, blue, pink)
- **Smooth animations** throughout
- **Fully responsive** (mobile to desktop)
- **Confetti celebration** on completion

### Components
1. **FileUpload** - Drag-and-drop with file validation
2. **ConfigPanel** - Language, temperature, custom prompt
3. **OutputPanel** - Dual-tab display (transcript + MOM)
4. **ProcessingStatus** - 4-stage progress indicator
5. **App** - Main orchestrator with API integration

### Functionality
- ✅ Multi-language support (EN, BN, ES)
- ✅ Real-time progress display
- ✅ Error handling with retry
- ✅ Copy to clipboard
- ✅ Download as Markdown
- ✅ Download as Plaintext
- ✅ Professional markdown rendering
- ✅ Dark mode with gradients
- ✅ Responsive layout

---

## 🔌 Backend Features

### Technologies
- **Express.js** - HTTP server
- **Deepgram SDK** - Speech-to-text
- **Google Generative AI** - MOM generation
- **Multer** - File upload handling
- **CORS** - Cross-origin support

### API Endpoint
```
POST /api/transcribe

Request (multipart/form-data):
  - audio: File (required)
  - language: String (optional, default: en)
  - temperature: Float (optional, default: 0.2)
  - customPrompt: String (optional)

Response:
  {
    success: true,
    transcript: "...",
    mom: "...",
    metadata: {
      language: "en",
      temperature: 0.2,
      audioSize: 5242880,
      timestamp: "2026-05-20T..."
    }
  }
```

### Features
- ✅ Audio transcription (Deepgram)
- ✅ Speaker diarization
- ✅ Professional MOM generation (Gemini)
- ✅ Custom system prompts
- ✅ Error handling
- ✅ File validation
- ✅ 100MB file limit
- ✅ Multi-language support

---

## 🔑 Configuration

### Backend (.env in root)
```
DEEPGRAM_API_KEY=your_deepgram_key
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=development
```

### Frontend (REACT_APP_API_BASE_URL)
```
REACT_APP_API_BASE_URL=http://localhost:5000
```

### Get Free API Keys
- **Deepgram**: https://console.deepgram.com/signup
- **Gemini**: https://aistudio.google.com/app/apikey

---

## 📊 Processing Flow

```
1. User uploads audio file → 
   Frontend validates (type, size)

2. Frontend sends to backend → 
   POST /api/transcribe

3. Backend sends to Deepgram → 
   Returns transcript with speaker diarization

4. Backend formats transcript → 
   [Speaker 0]: ... [Speaker 1]: ...

5. Backend sends to Gemini → 
   Using your system prompt from prompt.txt

6. Gemini returns MOM → 
   Professional markdown document

7. Backend returns JSON → 
   {transcript, mom, metadata}

8. Frontend displays results → 
   Dual-tab view with export options
```

---

## ✨ Customization Guide

### Change Theme Colors
Edit `frontend/src/index.css`:
```css
.gradient-orb-1 {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) ...);
}
```

### Adjust Animation Speed
Edit keyframes in `index.css`:
```css
@keyframes float {
  /* Modify timing from 8s to desired duration */
}
```

### Custom System Prompt
Edit `prompt.txt` in root directory - it's automatically loaded by the backend.

### Supported Languages
Deepgram supports: en, bn, es, fr, de, hi, pt, ru, ja, zh, ko, and more.

---

## 🧪 Testing

### Test Backend Health
```bash
curl http://localhost:5000/health
```

### Test Full Pipeline
```bash
curl -X POST http://localhost:5000/api/transcribe \
  -F "audio=@meeting.mp3" \
  -F "language=en" \
  -F "temperature=0.2"
```

### Test Frontend
1. Open http://localhost:3000
2. Upload audio file
3. Configure settings
4. Watch progress
5. Download results

---

## 📝 MOM System Prompt

Your custom system prompt is in `prompt.txt`. It includes:
- Executive summary
- Core discussions & outcomes
- Action items matrix
- Next steps & follow-up
- Data preservation rules
- Edge-case handling

Edit `prompt.txt` to customize MOM format!

---

## 🐛 Troubleshooting

### Backend Issues
| Problem | Solution |
|---------|----------|
| API key not found | Check `.env` file in backend directory |
| Port already in use | Kill process on 5000 or change PORT in .env |
| Deepgram error | Verify API key is active |
| Gemini error | Check API key and quota |

### Frontend Issues
| Problem | Solution |
|---------|----------|
| Can't upload file | Verify backend is running |
| Port 3000 in use | Run `PORT=3001 npm start` |
| No gradient animation | Check if CSS loaded properly |
| API timeout | Check internet connection |

---

## 📦 Dependencies

### Backend
- @deepgram/sdk ^3.5.0
- @google/generative-ai ^0.7.0
- express ^4.18.2
- multer ^1.4.5-lts.1
- dotenv ^16.3.1
- cors ^2.8.5

### Frontend
- react ^18.2.0
- react-markdown ^9.0.1
- lucide-react ^0.292.0
- canvas-confetti ^1.9.0
- axios ^1.6.2
- react-scripts 5.0.1
- tailwindcss (via CDN)

---

## 🌐 Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Quick testing guide
- **[PHASE_1_SETUP.md](PHASE_1_SETUP.md)** - Environment setup
- **[PHASE_2_IMPLEMENTATION.md](PHASE_2_IMPLEMENTATION.md)** - Backend API docs
- **[PHASE_3_FRONTEND.md](PHASE_3_FRONTEND.md)** - Frontend component docs
- **[FRONTEND_READY.md](FRONTEND_READY.md)** - Frontend quick start

---

## 🎯 Next Steps (Optional)

Potential enhancements:
- [ ] Add speaker identification modal
- [ ] Implement batch processing
- [ ] Add search in transcript
- [ ] Export to Google Docs/Word
- [ ] Real-time speech detection
- [ ] Webhook notifications
- [ ] User authentication
- [ ] Admin dashboard
- [ ] Analytics tracking
- [ ] Email delivery of MOM

---

## ✅ Checklist for Production

- [ ] Add your Deepgram API key
- [ ] Add your Gemini API key
- [ ] Customize `prompt.txt` if needed
- [ ] Test with sample audio files
- [ ] Verify dark theme looks good on your display
- [ ] Test on mobile devices
- [ ] Check performance with large files
- [ ] Set up error logging
- [ ] Configure CORS for production
- [ ] Deploy backend and frontend

---

## 🤝 Support

For issues or questions:
1. Check troubleshooting sections in relevant phase docs
2. Verify API keys are correct
3. Ensure both backend and frontend are running
4. Check browser console for errors
5. Review terminal output for logs

---

## 📄 License

This project is ready for production use.

---

## 🎉 You're All Set!

The complete meeting minutes generation platform is ready to use!

**Run these commands in separate terminals:**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

Then visit **http://localhost:3000** 🚀

**Happy meeting transcribing!** 📝✨
