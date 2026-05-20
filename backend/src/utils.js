import fs from "fs";
import path from "path";

/**
 * Load the system prompt from prompt.txt
 */
export const loadSystemPrompt = () => {
  try {
    const promptPath = path.join(process.cwd(), "prompt.txt");
    const prompt = fs.readFileSync(promptPath, "utf-8");
    return prompt;
  } catch (err) {
    console.error("Error loading prompt.txt:", err.message);
    return getDefaultSystemPrompt();
  }
};

/**
 * Default fallback system prompt
 */
const getDefaultSystemPrompt = () => {
  return `You are an expert executive assistant and corporate project manager. Your task is to analyze the provided multi-speaker meeting transcript and generate a highly professional, structured, and objective Minutes of Meeting (MOM) document.

Adhere to the following strict rules during generation:
1. Tone: Maintain a formal, third-person corporate tone. Eliminate all conversational filler, pleasantries, and tangents.
2. Organization: Do NOT summarize chronologically. Group the discussion points semantically by topic or agenda item.
3. Speaker Attribution: Track the speaker IDs (e.g., Speaker 0, Speaker 1). If a speaker explicitly states their name or role within the conversation, map that identity to their speaker ID throughout the document.
4. Data Preservation (CRITICAL): Preserve all numbers, names, budget figures, dates, percentages, specific technical values, or alphanumeric codes exactly as stated in the transcript.
5. Grounded Veracity: Ground all action items, decisions, and deadlines strictly in the text. If an action item is mentioned but no assignee or deadline is specified, mark it clearly as [TBD].`;
};

/**
 * Format Deepgram transcription output into readable speaker-labeled text
 * @param {Object} deepgramResult - Result object from Deepgram API
 * @returns {string} Formatted transcript with speaker labels
 */
export const formatTranscript = (deepgramResult) => {
  try {
    if (!deepgramResult.results || !deepgramResult.results.channels) {
      return "";
    }

    const channel = deepgramResult.results.channels[0];
    if (!channel.alternatives || channel.alternatives.length === 0) {
      return "";
    }

    const alternative = channel.alternatives[0];
    
    // Check if paragraphs with diarization are available
    if (alternative.paragraphs && alternative.paragraphs.paragraphs) {
      const paragraphs = alternative.paragraphs.paragraphs;
      
      return paragraphs
        .map((p) => {
          const speakerId = p.speaker !== undefined ? p.speaker : "Unknown";
          const sentences = p.sentences
            .map((s) => s.text)
            .join(" ");
          return `[Speaker ${speakerId}]: ${sentences}`;
        })
        .join("\n\n");
    }

    // Fallback: use words array if paragraphs not available
    if (alternative.words) {
      let transcript = "";
      let currentSpeaker = null;
      let currentText = "";

      alternative.words.forEach((word) => {
        const speaker = word.speaker !== undefined ? word.speaker : 0;
        
        if (speaker !== currentSpeaker && currentText) {
          if (currentSpeaker !== null) {
            transcript += `[Speaker ${currentSpeaker}]: ${currentText.trim()}\n\n`;
          }
          currentSpeaker = speaker;
          currentText = word.word + " ";
        } else {
          currentSpeaker = speaker;
          currentText += word.word + " ";
        }
      });

      if (currentText) {
        transcript += `[Speaker ${currentSpeaker}]: ${currentText.trim()}`;
      }

      return transcript;
    }

    return "";
  } catch (err) {
    console.error("Error formatting transcript:", err);
    return "";
  }
};

/**
 * Validate audio file
 * @param {Object} file - Multer file object
 * @returns {Object} {valid: boolean, error?: string}
 */
export const validateAudioFile = (file) => {
  if (!file) {
    return { valid: false, error: "Missing audio file." };
  }

  const allowedMimes = [
    "audio/mpeg",
    "audio/wav",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg",
    "audio/webm",
  ];

  if (!allowedMimes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid audio format. Supported formats: mp3, wav, m4a, ogg, webm. Received: ${file.mimetype}`,
    };
  }

  if (file.size > 100 * 1024 * 1024) {
    return { valid: false, error: "File size exceeds 100MB limit." };
  }

  return { valid: true };
};
