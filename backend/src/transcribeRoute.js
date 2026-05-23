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
    console.log(`📋 Field received: ${fieldname}`);
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
 * Builds Deepgram and Gemini clients from either request keys or env keys.
 * Env-based clients are cached; request-supplied keys are created per request.
 */
const createKeyedClients = ({ deepgramKey, geminiKey } = {}) => {
  const resolvedDeepgramKey = deepgramKey?.trim() || process.env.DEEPGRAM_API_KEY?.trim();
  const resolvedGeminiKey = geminiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

  if (!resolvedDeepgramKey || !resolvedGeminiKey) {
    throw new Error('Missing required Deepgram or Gemini API key.');
  }

  const useSharedCache = !deepgramKey?.trim() && !geminiKey?.trim();

  if (useSharedCache) {
    if (!deepgramInstance) {
      console.log('Lazy Loading: Initializing Deepgram Client Instance...');
      deepgramInstance = createClient(resolvedDeepgramKey);
    }

    if (!geminiInstance) {
      console.log('Lazy Loading: Initializing Modern Google Gemini Client Instance...');
      geminiInstance = new GoogleGenerativeAI(resolvedGeminiKey);
    }

    return {
      deepgram: deepgramInstance,
      gemini: geminiInstance,
    };
  }

  console.log('Initializing per-request API clients from user-provided keys...');
  return {
    deepgram: createClient(resolvedDeepgramKey),
    gemini: new GoogleGenerativeAI(resolvedGeminiKey),
  };
};

/**
 * Helper function to send SSE event
 */
const sendSSEEvent = (res, eventType, data) => {
  res.write(`data: ${JSON.stringify({ type: eventType, ...data })}\n\n`);
};

const createFriendlyApiError = (error, source = 'server') => {
  const message = error?.message || String(error || 'Unknown error');
  const status = error?.status || error?.response?.status || error?.code || '';
  const lowered = message.toLowerCase();

  const isAuthError =
    status === 401 ||
    status === 403 ||
    lowered.includes('unauthorized') ||
    lowered.includes('invalid api key') ||
    lowered.includes('invalid_api_key') ||
    lowered.includes('api key') && lowered.includes('invalid');

  const isQuotaError =
    status === 429 ||
    lowered.includes('quota') ||
    lowered.includes('rate limit') ||
    lowered.includes('too many requests') ||
    lowered.includes('limit exceeded') ||
    lowered.includes('resource exhausted');

  const isServerError =
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    lowered.includes('internal server error') ||
    lowered.includes('service unavailable');

  if (isAuthError) {
    return {
      code: 'AUTH_INVALID_KEY',
      source,
      retryable: false,
      message: source === 'deepgram'
        ? 'Deepgram API key is invalid, revoked, or unauthorized.'
        : source === 'gemini'
          ? 'Gemini API key is invalid, revoked, or unauthorized.'
          : 'API key is invalid, revoked, or unauthorized.',
      details: message,
    };
  }

  if (isQuotaError) {
    return {
      code: 'QUOTA_OR_RATE_LIMIT',
      source,
      retryable: true,
      message: source === 'deepgram'
        ? 'Deepgram quota or rate limit was reached. Try again later or check your plan.'
        : source === 'gemini'
          ? 'Gemini quota or rate limit was reached. Try again later or check your plan.'
          : 'Quota or rate limit was reached. Try again later.',
      details: message,
    };
  }

  if (isServerError) {
    return {
      code: 'PROVIDER_SERVER_ERROR',
      source,
      retryable: true,
      message: source === 'deepgram'
        ? 'Deepgram service returned an error. Please try again.'
        : source === 'gemini'
          ? 'Gemini service returned an error. Please try again.'
          : 'Provider service returned an error. Please try again.',
      details: message,
    };
  }

  return {
    code: 'UNKNOWN_PROVIDER_ERROR',
    source,
    retryable: true,
    message,
    details: message,
  };
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

    // Initialize clients from request-supplied keys or env defaults
    const { deepgram, gemini } = createKeyedClients({
      deepgramKey: req.body.deepgramKey,
      geminiKey: req.body.geminiKey,
    });
    console.log('✓ API clients initialized');

    // Extract parameters from request
    const {
      language = "en",
      temperature = 0.2,
      customPrompt = null,
    } = req.body;

    console.log('📋 Request params:', {
      language,
      temperature,
      customPrompt: !!customPrompt,
      deepgramKey: !!req.body.deepgramKey,
      geminiKey: !!req.body.geminiKey,
    });

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
    let result;
    try {
      const transcriptionResponse = await deepgram.listen.prerecorded.transcribeFile(req.file.stream, {
        model: "nova-3",
        language: language,
        diarize: true,
        smart_format: true,
        filler_words: false,
      });
      result = transcriptionResponse.result;
    } catch (error) {
      const friendlyError = createFriendlyApiError(error, 'deepgram');
      console.error('❌ Deepgram Error:', error);
      sendSSEEvent(res, 'error', friendlyError);
      return res.end();
    }

    const transcriptionTime = Date.now() - transcriptionStartTime;
    console.log(`✓ Deepgram response received in ${transcriptionTime}ms`);

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
    let momText;
    try {
      const response = await model.generateContent(
        `Here is the multi-speaker meeting transcript to summarize:\n\n${formattedTranscript}`
      );
      momText = response.response.text();
    } catch (error) {
      const friendlyError = createFriendlyApiError(error, 'gemini');
      console.error('❌ Gemini Error:', error);
      sendSSEEvent(res, 'error', friendlyError);
      return res.end();
    }

    const momTime = Date.now() - momStartTime;
    console.log(`✓ Gemini response received in ${momTime}ms`);

    if (!momText) {
      sendSSEEvent(res, 'error', {
        code: 'EMPTY_MODEL_RESPONSE',
        source: 'gemini',
        retryable: true,
        message: 'Failed to generate MOM. Please try again.',
        details: 'The Gemini model returned an empty response.',
      });
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
