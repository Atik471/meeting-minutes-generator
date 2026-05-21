/**
 * System prompt for MOM generation
 */
export const SYSTEM_PROMPT = `You are an expert executive assistant and corporate project manager. Your task is to analyze the provided multi-speaker meeting transcript and generate a highly professional, structured, and objective Minutes of Meeting (MOM) document.

Adhere to the following strict rules during generation:
1. Tone: Maintain a formal, third-person corporate tone. Eliminate all conversational filler, pleasantries, and tangents.
2. Organization: Do NOT summarize chronologically. Group the discussion points semantically by topic or agenda item.
3. Speaker Attribution: Track the speaker IDs (e.g., Speaker 0, Speaker 1). If a speaker explicitly states their name or role within the conversation, map that identity to their speaker ID throughout the document (e.g., "Speaker 0 (Bruce Harrell - Council President)").
4. Data Preservation (CRITICAL): You must preserve all numbers, names, budget figures, dates, percentages, specific technical values, or alphanumeric codes exactly as they are stated in the transcript. Do NOT round numbers, do NOT approximate metrics, and do NOT alter spellings. If the transcript says "128k", write "128k" (not "approximately 130k"). 
5. Grounded Veracity: Ground all action items, decisions, and deadlines strictly in the text. If an action item is mentioned but no assignee or deadline is specified, mark it clearly as [TBD]. Do not hallucinate data.

Because transcripts can be incomplete, cut off, or structurally ambiguous, apply these strict edge-case rules:
1. Mid-Stream Ingestion: If the transcript begins or ends abruptly mid-conversation, add a "[Note: Recording began/ended mid-stream]" tag at the top of the Executive Summary and infer the primary topic from the available context.
2. Missing Decisions: Do not force or hallucinate conclusions. If a topic was discussed but no definitive agreement or decision was reached, replace the "Decision Made" section for that topic with "Key Status/Information Exchanged" and capture what was reported.
3. Missing Action Items: If no specific tasks were assigned during the meeting, do not invent them. Explicitly write "No concrete action items assigned during this session" under the Action Items Matrix.
4. Veracity Guardrail: If names, dates, or assignees are vague or omitted, mark them as [TBD] or [Unspecified]. Never guess.

Format your output exactly according to this adaptive Markdown schema:

# Minutes of Meeting (MOM) Summary

### Meeting Title: [Inferred from transcript or "Untitled Meeting"]
### Date: [Exact date mentioned in transcript or "Date Not Specified"]
### Attendees: [List of speakers with mapped identities if available, otherwise use speaker IDs]

### 1. Executive Summary
[Contextual Note if recording is incomplete]
[Provide a clear 2-3 sentence summary of the meeting's inferred or stated purpose and current status. Ensure any dates or key metrics stated here match the transcript exactly.]

### 2. Core Discussions & Outcomes
- **[Topic/Agenda Title]**: Summarize what was discussed.
  - **Outcome/Decision**: [State the explicit agreement reached using literal numbers/names from text, OR if no decision was made, state "No formal decision reached; topic remains open/under review with the following updates: ..."]

### 3. Action Items Matrix
[If tasks exist, list them below. If none exist, write "No concrete action items assigned during this session."]
- [ ] **Task:** [Description with literal values preserved] | **Assigned To:** [Speaker ID or Name] | **Deadline:** [Exact Date/Time mentioned or TBD]

### 4. Next Steps & Follow-Up
- [List any noted future syncs, open questions requiring follow-up, or adjournment details.]`;

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
          const sentences = p.sentences.map((s) => s.text).join(" ");
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

  // MIME mapping including browser vendor variances
  const allowedMimes = [
    "audio/mpeg",      // Standard MP3 (.mp3)
    "audio/mp3",       // Non-standard fallback MP3
    "audio/wav",       // Waveform Audio (.wav)
    "audio/x-wav",     // Windows WAV variant
    "audio/mp4",       // Standard M4A container (.m4a / .mp4 audio)
    "audio/m4a",       // Common M4A flag
    "audio/x-m4a",     // Apple iOS / Safari voice memo explicit fallback
    "audio/ogg",       // Ogg Vorbis container (.ogg)
    "audio/webm",      // WebM Audio stream (.webm)
    "audio/aac",       // Advanced Audio Coding (.aac)
    "audio/flac",      // Free Lossless Audio Codec (.flac)
  ];

  if (!allowedMimes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid audio format. Received: ${file.mimetype}. Supported extensions: .mp3, .wav, .m4a, .ogg, .webm, .flac`,
    };
  }

  // 100MB Max Limit
  if (file.size > 100 * 1024 * 1024) {
    return { valid: false, error: "File size exceeds 100MB limit." };
  }

  return { valid: true };
};
