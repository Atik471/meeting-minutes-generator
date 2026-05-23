import { createClient } from "@deepgram/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import multer from "multer";
import {
  formatTranscript,
  validateAudioFile,
  SYSTEM_PROMPT,
} from "../src/utils.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  storage: multer.memoryStorage(),
});

// Initialize placeholder variable 
let deepgramInstance = null;
let geminiInstance = null;

/**
 * Lazy-loads and caches API connection clients 
 */
export const initializeClients = () => {
  const deepgramKey = process.env.DEEPGRAM_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (!deepgramKey || !geminiKey) {
    throw new Error("Missing required environment API keys inside your .env configuration storage.");
  }

  if (!deepgramInstance) {
    console.log("Lazy Loading: Initializing Deepgram Client Instance...");
    console.log(`  Deepgram Key: ${deepgramKey.substring(0, 10)}...${deepgramKey.substring(deepgramKey.length - 5)}`);
    deepgramInstance = createClient(deepgramKey);
  }

  if (!geminiInstance) {
    console.log("Lazy Loading: Initializing Modern Google Gemini Client Instance...");
    console.log(`  Gemini Key: ${geminiKey.substring(0, 10)}...${geminiKey.substring(geminiKey.length - 5)}`);
    geminiInstance = new GoogleGenerativeAI(geminiKey);
  }

  return { 
    deepgram: deepgramInstance, 
    gemini: geminiInstance 
  };
};

/**
 * Helper function to send SSE event
 */
const sendSSEEvent = (res, eventType, data) => {
  res.write(`data: ${JSON.stringify({ type: eventType, ...data })}\n\n`);
};

/**
 * POST /api/transcribe
 * Main endpoint for transcribing audio and generating MOM
 * Uses Server-Sent Events (SSE) for real-time progress updates
 */
router.post("/", upload.single("audio"), async (req, res) => {
  try {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Initialize clients on first request and capture them
    const { deepgram, gemini } = initializeClients();

    // Validate audio file
    const fileValidation = validateAudioFile(req.file);
    if (!fileValidation.valid) {
      sendSSEEvent(res, 'error', { message: fileValidation.error });
      return res.end();
    }

    // Extract parameters from request
    const {
      language = "en",
      temperature = 0.2,
      customPrompt = null,
    } = req.body;

    console.log("Step 1/2: Transcribing audio with Deepgram Nova-3...");
    const transcriptionStartTime = Date.now();

    // Transcribe audio with Deepgram
    const { result, error: deepgramError } =
      await deepgram.listen.prerecorded.transcribeFile(req.file.buffer, {
        model: "nova-3",
        language: language,
        diarize: true,
        smart_format: true,
        filler_words: false,
      });

    const transcriptionTime = Date.now() - transcriptionStartTime;

    if (deepgramError) {
      console.error("Deepgram Error:", deepgramError);
      sendSSEEvent(res, 'error', { message: `Deepgram transcription failed: ${deepgramError.message}` });
      return res.end();
    }

    // Format transcript with speaker labels
    const formattedTranscript = formatTranscript(result);

    if (!formattedTranscript || formattedTranscript.trim().length === 0) {
      sendSSEEvent(res, 'error', { message: 'Audio processed but no clear conversational speech was detected.' });
      return res.end();
    }

    // Send transcription complete event
    console.log(`Transcription complete in ${transcriptionTime}ms`);
    sendSSEEvent(res, 'progress', {
      stage: 2,
      label: 'Transcribing',
      status: 'complete',
      processingTime: transcriptionTime,
    });

    console.log("Step 2/2: Generating MOM with Gemini 2.5 Flash...");
    const momStartTime = Date.now();

    // Use hardcoded system prompt or custom prompt
    const systemPrompt = customPrompt || SYSTEM_PROMPT;

    // Generate MOM with Gemini
    const model = gemini.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    });

    const response = await model.generateContent(
      `Here is the multi-speaker meeting transcript to summarize:\n\n${formattedTranscript}`
    );

    const momTime = Date.now() - momStartTime;
    const momText = response.response.text();

    if (!momText) {
      sendSSEEvent(res, 'error', { message: 'Failed to generate MOM. Please try again.' });
      return res.end();
    }

    console.log("✅ Processing Complete!");
    console.log(`  Transcription: ${transcriptionTime}ms`);
    console.log(`  MOM Generation: ${momTime}ms`);

    // Send MOM complete event with all results
    sendSSEEvent(res, 'complete', {
      stage: 4,
      label: 'Complete',
      success: true,
      transcript: formattedTranscript,
      mom: momText,
      metadata: {
        language: language,
        temperature: parseFloat(temperature),
        audioSize: req.file.size,
        timestamp: new Date().toISOString(),
        processingTime: {
          transcription: transcriptionTime,
          momGeneration: momTime,
          total: transcriptionTime + momTime,
        },
      },
    });

    res.end();
  } catch (err) {
    console.error("Pipeline Error:", err);
    sendSSEEvent(res, 'error', {
      message: err.message || "Internal server error during transcription pipeline",
    });
    res.end();
  }
});

export default router;
