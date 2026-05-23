# Meeting Minutes Generator

Meeting Minutes Generator is a web app that turns an uploaded meeting recording into a transcript and a polished Minutes of Meeting document.

The app uses:
- Deepgram for speech-to-text transcription
- Gemini for summarizing the transcript into meeting minutes
- A React + Vite frontend for upload, configuration, and results
- An Express backend that streams audio directly to Deepgram

## Features

- Upload an audio file and process it in the browser
- Stream audio through the server without writing the file to disk
- Generate a transcript with speaker labels
- Generate structured meeting minutes from the transcript
- Export the output as Markdown or plain text
- Let users supply their own Deepgram and Gemini API keys per request
- Show structured API/provider errors in the UI

## How It Works

1. The frontend sends the uploaded audio and configuration to the backend.
2. The backend parses the multipart request with `busboy`.
3. The audio stream is piped through a `PassThrough` stream directly into Deepgram.
4. The transcript is formatted.
5. Gemini generates the meeting minutes from that transcript.
6. The backend returns progress updates and the final result over SSE.

Important: the current backend is an Express server. It is not yet deployed as a Vercel Serverless Function, so a full Vercel deployment requires adapting the backend or hosting it separately.

## Project Structure

```text
meeting-minutes-generator/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── transcribeRoute.js
│   │   └── utils.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Requirements

- Node.js 18 or newer
- A Deepgram API key
- A Gemini API key

## Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Create a `.env` file in `backend/` with:

```env
PORT=5000
DEEPGRAM_API_KEY=your_deepgram_key
GEMINI_API_KEY=your_gemini_key
```

The frontend can also accept keys per request through the UI.

### 3. Configure the frontend API URL

By default, the frontend uses `http://localhost:5000`.

If your backend is hosted elsewhere, set:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

## Run Locally

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

Open the frontend URL shown by Vite in your browser.

## API Overview

### `GET /health`

Returns a basic health check.

### `GET /api/default-prompt`

Returns the default Gemini system prompt.

### `POST /api/transcribe`

Accepts:
- `audio` file upload
- `language`
- `temperature`
- optional `customPrompt`
- optional `deepgramKey`
- optional `geminiKey`

Returns SSE events for:
- upload received
- transcription progress
- completion
- errors

## Notes on API Keys

- If the user enters keys in the UI, those keys are sent only with that request.
- Keys are not stored in browser persistent storage.
- The backend prefers request-scoped keys when provided and falls back to `.env` keys otherwise.

## Deployment Notes

### Backend on Vercel

Deploy the `backend/` folder as a separate Vercel project.

Use these settings after importing the repository from GitHub:
- Root Directory: `backend`
- Framework Preset: Other
- Build Command: leave empty
- Output Directory: leave empty

Add these environment variables in Vercel:
- `DEEPGRAM_API_KEY`
- `GEMINI_API_KEY`

The backend functions are exposed as:
- `GET /api/health`
- `GET /api/default-prompt`
- `POST /api/transcribe`

### Frontend on Vercel

The frontend is Vite-based and can be deployed to Vercel as a static site.

### Backend hosting

The local backend still runs as a normal Express server, but the Vercel deployment now uses function entrypoints inside `backend/api/`.

If the backend is hosted separately, set `VITE_API_BASE_URL` in the frontend deployment environment to the backend Vercel URL.

## Tech Stack

- React 18
- Vite
- Express
- busboy
- Deepgram SDK
- Google Generative AI SDK

## Troubleshooting

- If uploads fail immediately, check that the backend is running and reachable from the frontend.
- If the UI shows an auth error, verify the Deepgram and Gemini keys.
- If the UI shows a quota or rate-limit error, the provider likely rejected the request due to usage limits.

## License

MIT
