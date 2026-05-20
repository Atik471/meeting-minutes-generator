import { createClient } from "@deepgram/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import multer from "multer";
import {
  formatTranscript,
  validateAudioFile,
  loadSystemPrompt,
} from "../src/utils.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  storage: multer.memoryStorage(),
});

// Initialize APIs
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /api/transcribe
 * Main endpoint for transcribing audio and generating MOM
 */
router.post("/", upload.single("audio"), async (req, res) => {
  try {
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

    console.log("⚡ Step 1/2: Transcribing audio with Deepgram Nova-3...");

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

    console.log("⚡ Step 2/2: Generating MOM with Gemini 2.5 Flash...");

    // Load system prompt (from file or custom)
    const systemPrompt = customPrompt || loadSystemPrompt();

    // Generate MOM with Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
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
