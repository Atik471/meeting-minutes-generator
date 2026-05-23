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
 * POST /api/transcribe
 * Main endpoint for transcribing audio and generating MOM
 */
router.post("/", upload.single("audio"), async (req, res) => {
  try {
    // Initialize clients on first request and capture them
    const { deepgram, gemini } = initializeClients();

    // Validate audio file
    const fileValidation = validateAudioFile(req.file);
    if (!fileValidation.valid) {
      return res.status(400).json({ error: fileValidation.error });
    }

    // Extract parameters from request
    const {
      language = "en",
      temperature = 0.2,
      customPrompt = null,
    } = req.body;

    console.log("Step 1/2: Transcribing audio with Deepgram Nova-3...");

    // Transcribe audio with Deepgram
    const { result, error: deepgramError } =
      await deepgram.listen.prerecorded.transcribeFile(req.file.buffer, {
        model: "nova-3",
        language: language,
        diarize: true,
        smart_format: true,
        filler_words: false,
      });

    if (deepgramError) {
      console.error("Deepgram Error:", deepgramError);
      throw new Error(`Deepgram transcription failed: ${deepgramError.message}`);
    }

    // Format transcript with speaker labels
    const formattedTranscript = formatTranscript(result);

    if (!formattedTranscript || formattedTranscript.trim().length === 0) {
      return res.status(422).json({
        error:
          "Audio processed but no clear conversational speech was detected.",
      });
    }

    console.log("Step 2/2: Generating MOM with Gemini 2.5 Flash...");

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

    const momText = response.response.text();

    if (!momText) {
      return res.status(500).json({
        error: "Failed to generate MOM. Please try again.",
      });
    }

    console.log("✅ Processing Complete!");

    // Return results
    return res.status(200).json({
      success: true,
      transcript: formattedTranscript,
      mom: momText,
      metadata: {
        language: language,
        temperature: parseFloat(temperature),
        audioSize: req.file.size,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Pipeline Error:", err);
    return res.status(500).json({
      error: err.message || "Internal server error during transcription pipeline",
    });
  }
});

export default router;
