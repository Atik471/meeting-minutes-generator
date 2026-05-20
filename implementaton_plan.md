# Implementation Plan: End-to-End MOM Automation Platform

This comprehensive, modular blueprint covers the implementation of a full-stack asynchronous processing pipeline. It integrates **Deepgram Nova-3** (Speech-to-Text) with **Gemini 2.5 Flash** (Minutes of Meeting Generation) alongside a high-end web dashboard.

---

## 1. System Architecture Diagram

```text
[Frontend View: Next.js / Tailwind] 
       │ 
       ├── (POST /api/transcribe) ──> [Backend Server: Express / NestJS]
       │                                     │
       │                              1. Streams Audio File
       │                                     ▼
       │                              [Deepgram API (Nova-3)] 
       │                                     │
       │                              2. Returns Diarized JSON
       │                                     ▼
       │                              [Backend Data Formatter] (Stitches segments into text)
       │                                     │
       │                              3. Sends Text + System Prompt
       │                                     ▼
       │                              [Gemini API (2.5 Flash)]
       │                                     │
       │                              4. Returns Markdown MOM
       │                                     ▼
       ▼                                     │
[Render Markdown, Copy, Download] <──────────┘

```

---

## 2. API Options Integration Layer

To provide advanced flexibility via the frontend dashboard, expose the native parameters of both underlying model APIs as user toggles.

### Deepgram Nova-3 Configuration Parameters

* `diarize` (Boolean, Default: `true`): Tracks separate speaker channels natively.
* `language` (String Dropdown, Default: `bn`): Explicitly pins acoustic mapping to Bengali, English (`en`), or Spanish (`es`).
* `smart_format` (Boolean, Default: `true`): Enforces punctuation, capitalization, and paragraph layouts.
* `filler_words` (Boolean, Default: `false`): Filters out conversational pauses like "uh" or "um".

### Gemini 2.5 Flash Configuration Parameters

* `temperature` (Slider, Range: `0.0 - 1.0`, Default: `0.2`): Lower values lock down strict analytical formatting; higher values increase prose variation.
* `systemInstruction` (Textarea, Default: Custom MOM System Prompt): Exposes the exact system instruction layer so users can fine-tune organizational behavior manually.

---

## 3. Step-by-Step Development Phases

### Phase 1: Environment Setup & Infrastructure

1. Initialize a Monorepo workspace or clean frontend/backend project folders.
2. Install dependencies:
* **Backend:** `@deepgram/sdk`, `@google/genai`, `dotenv`, `multer` (for handling multi-part audio file buffer ingestion safely).
* **Frontend:** `lucide-react` (icons), `react-markdown` (safe markdown rendering), `canvas-confetti` (for successful processing states).


3. Configure a root `.env` file containing validation secrets:
```text
DEEPGRAM_API_KEY=your_deepgram_key
GEMINI_API_KEY=your_gemini_key
PORT=5000

```



### Phase 2: Unified Backend API Processing Route

Create an endpoint `POST /api/transcribe` that streams the uploaded audio to Deepgram, parses the returning frame tokens, and immediately pipes the generated string into Gemini.

```javascript
// Target Route: POST /api/transcribe
import { createClient } from "@deepgram/sdk";
import { GoogleGenAI } from "@google/genai";
import express from "express";
import multer from "multer";

const router = express.Router();
const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB max limit

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing audio file." });

    // 1. Parse operational configurations passed from frontend UI toggles
    const { language = "bn", temperature = 0.2, customPrompt } = req.body;

    console.log("⚡ Executing Step 1: Querying Deepgram Nova-3 API...");
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      req.file.buffer,
      {
        model: "nova-3",
        language: language,
        diarize: true,
        smart_format: true,
        filler_words: false,
      }
    );

    if (error) throw error;

    // 2. Stitch the returned deepgram paragraphs array into speaker-labeled string blocks
    const paragraphs = result.results.channels[0].alternatives[0].paragraphs?.paragraphs || [];
    const formattedTranscript = paragraphs
      .map(p => `[Speaker ${p.speaker}]: ${p.sentences.map(s => s.text).join(" ")}`)
      .join("\n\n");

    if (!formattedTranscript) {
      return res.status(422).json({ error: "Audio processed but no clear conversational speech was detected." });
    }

    console.log("⚡ Executing Step 2: Querying Gemini 2.5 Flash Summary Engine...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Here is the multi-speaker meeting transcript to summarize:\n\n${formattedTranscript}`,
      config: {
        systemInstruction: customPrompt,
        temperature: parseFloat(temperature),
      }
    });

    // 3. Return the payload to the dashboard frontend
    return res.status(200).json({
      transcript: formattedTranscript,
      mom: response.text
    });

  } catch (err) {
    console.error("Pipeline Failure:", err);
    return res.status(500).json({ error: err.message || "Internal Automation Pipeline Error" });
  }
});

export default router;

```

### Phase 3: High-End UI Implementation

Build a minimalist layout using standard modern frontend patterns (such as Tailwind CSS).

#### 1. Configuration Panel (Sidebar Controls)

* Render a language picker selection input (options: Bengali, English).
* Render a slider targeting the `temperature` parameter value.
* Render an expandable accordion text box displaying the active `System Prompt` template, allowing the user to make real-time custom edits before submitting.

#### 2. Drag & Drop File Zone

* Create a stylized dotted drag area tracking active drag events (`onDragOver`, `onDrop`).
* Accept standard audio formats (`.mp3`, `.wav`, `.m4a`).
* Display a live progress bar with text descriptions detailing the current active state (e.g., `[Step 1/2]: Nova-3 Transcribing Audio...` $\rightarrow$ `[Step 2/2]: Gemini Compiling Minutes...`).

#### 3. Dual-Panel Output Grid (Tabbed or Side-by-Side)

* **Left View Panel / Tab 1 (Raw Diarized Output):** Renders the speaker blocks inside a scrollable box using fixed-width fonts for clean readability.
* **Right View Panel / Tab 2 (Generated MOM Preview):** Passes the Gemini string result straight through a `<ReactMarkdown>` processor component using an elegant typographic layout.

#### 4. Action Bars (Export Controls)

Implement individual interaction components for handling data exports cleanly.

```javascript
// Example implementation pattern for frontend copy/download event targets
const copyToClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
  alert("Content copied to clipboard!");
};

const downloadAsFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Available Actions Layout Buttons in UI:
// 1. Download MOM (Markdown) -> downloadAsFile(momContent, 'MOM.md', 'text/markdown')
// 2. Download MOM (Plaintext) -> downloadAsFile(momContent, 'MOM.txt', 'text/plain')
// 3. Download Transcript -> downloadAsFile(transcriptText, 'transcript.txt', 'text/plain')
// 4. Copy to Clipboard (Button sitting atop code panels)

```

---

## 4. Quality Control Checklist

* **File Streaming Safety:** Ensure the backend upload handling limits are configured to support long, uncompressed multi-speaker meeting clips without dropping connections or throwing out-of-memory errors.
* **Error Boundaries:** Gracefully handle edge cases in the UI, such as empty transcription returns or API token rate limits, by using friendly error screens instead of letting the application freeze.
* **Secure API Handling:** Keep the Deepgram and Gemini API keys isolated on the server backend. The frontend should interact *only* with the local endpoint `/api/transcribe`.

```

```