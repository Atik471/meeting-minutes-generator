import { createClient } from "@deepgram/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import busboy from "busboy";
import { PassThrough } from "stream";
import {
  formatTranscript,
  SYSTEM_PROMPT,
} from "../src/utils.js";

const router = express.Router();

/**
 * Custom streaming middleware for handling audio uploads
 * Uses busboy to parse multipart form data without buffering
 * Audio streams directly to Deepgram API
 */
const handleStreamingUpload = (req, res, next) => {
  console.log('📥 handleStreamingUpload middleware triggered');
  
  const bb = busboy({ headers: req.headers });
  let audioStream = null;
  let audioField = null;
  let hasError = false;

  bb.on('file', (fieldname, file, info) => {
    console.log(`📄 File field "${fieldname}" received: ${info.filename}`);
    if (hasError) {
      file.resume(); // drain the stream
      return;
    }
    
    audioField = { fieldname, filename: info.filename, encoding: info.encoding, mimetype: info.mimeType };
    
    // Use PassThrough to allow busboy to finish parsing while Deepgram processes
    // Audio flows: browser -> busboy -> PassThrough -> Deepgram (zero buffering!)
    audioStream = new PassThrough();
    
    file.on('data', (chunk) => {
      audioStream.write(chunk);
    });
    
    file.on('end', () => {
      audioStream.end();
      console.log('📄 File stream ended');
    });
    
    file.on('error', (error) => {
      console.error('❌ File stream error:', error);
      hasError = true;
      req.uploadError = error.message;
      audioStream.destroy(error);
    });
  });

  bb.on('field', (fieldname, val) => {
    console.log(`📋 Field received: ${fieldname} = ${val}`);
    req.body = req.body || {};
    req.body[fieldname] = val;
  });

  bb.on('close', () => {
    console.log('🔚 Busboy parsing complete');
    
    if (hasError) {
      console.error('❌ Upload had errors, rejecting request');
      return next(new Error(`Upload error: ${req.uploadError}`));
    }
    
    if (!audioStream) {
      console.error('❌ No audio file was received');
      return next(new Error('No audio file provided'));
    }

    req.file = {
      stream: audioStream,
      ...audioField
    };
    
    console.log('✓ Audio stream ready, calling next middleware');
    next();
  });

  bb.on('error', (error) => {
    console.error('❌ Busboy parser error:', error);
    hasError = true;
    req.uploadError = error.message;
  });

  console.log('⏳ Starting busboy multipart parsing...');
  req.pipe(bb);
};

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
 * 
 * ZERO-BUFFERING STREAMING ARCHITECTURE:
 * - Audio stream arrives from client via multipart form data
 * - Busboy parses multipart data without buffering file to disk
 * - Audio stream flows directly to Deepgram API (no intermediate buffering)
 * - Deepgram handles the stream, returns transcript
 * - Gemini generates MOM from transcript
 * - Results sent back via SSE
 * 
 * Memory usage: ~50-100MB (Node overhead only, not file size)
 * Multiple concurrent uploads: No cumulative RAM usage from files
 * No disk writes: All processing in memory with streaming
 */
router.post("/", handleStreamingUpload, async (req, res) => {
  try {
    console.log('🚀 POST /api/transcribe handler triggered');
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log('✓ SSE headers set');

    // Initialize clients on first request and capture them
    const { deepgram, gemini } = initializeClients();
    console.log('✓ API clients initialized');

    // Extract parameters from request
    const {
      language = "en",
      temperature = 0.2,
      customPrompt = null,
    } = req.body;

    console.log('📋 Request params:', { language, temperature, customPrompt: !!customPrompt });

    // Send immediate progress event to confirm upload received
    sendSSEEvent(res, 'progress', {
      stage: 1,
      label: 'Upload received',
      status: 'in-progress',
    });
    console.log('📤 Sent: upload received event');

    if (!req.file || !req.file.stream) {
      throw new Error('No audio stream available');
    }

    console.log("⏳ Step 1/2: Transcribing audio with Deepgram Nova-3...");
    const transcriptionStartTime = Date.now();

    // Transcribe audio directly via stream (zero buffering!)
    console.log('📡 Calling deepgram.listen.prerecorded.transcribeFile...');
    const { result, error: deepgramError } =
      await deepgram.listen.prerecorded.transcribeFile(req.file.stream, {
        model: "nova-3",
        language: language,
        diarize: true,
        smart_format: true,
        filler_words: false,
      });

    const transcriptionTime = Date.now() - transcriptionStartTime;
    console.log(`✓ Deepgram response received in ${transcriptionTime}ms`);

    if (deepgramError) {
      console.error("❌ Deepgram Error:", deepgramError);
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
    console.log(`✓ Transcription complete in ${transcriptionTime}ms`);
    sendSSEEvent(res, 'progress', {
      stage: 2,
      label: 'Transcribing',
      status: 'complete',
      processingTime: transcriptionTime,
    });

    console.log("⏳ Step 2/2: Generating MOM with Gemini 2.5 Flash...");
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

    console.log('📡 Calling gemini.generateContent...');
    const response = await model.generateContent(
      `Here is the multi-speaker meeting transcript to summarize:\n\n${formattedTranscript}`
    );

    const momTime = Date.now() - momStartTime;
    const momText = response.response.text();
    console.log(`✓ Gemini response received in ${momTime}ms`);

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
    console.error("❌ Pipeline Error:", err);
    sendSSEEvent(res, 'error', {
      message: err.message || "Internal server error during transcription pipeline",
    });
    res.end();
  }
});

export default router;
