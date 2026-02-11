const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

/**
 * Transcribe audio using Gemini 3 Flash
 * @param {string} audioPath - Path to the audio file
 * @param {string} mimeType - Mime type of the audio file (default: audio/mp3)
 * @returns {Promise<string>} - The transcription text
 */
async function transcribeAudio(audioPath, mimeType = "audio/mp3") {
    try {
        if (!process.env.GOOGLE_AI_API_KEY) {
            throw new Error("GOOGLE_AI_API_KEY is not set");
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        // Use Gemini 1.5 Flash (or 3.0 if available via alias) as it supports native audio
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

        const audioFileBuffer = fs.readFileSync(audioPath);
        const audioBase64 = audioFileBuffer.toString("base64");

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: audioBase64
                }
            },
            { text: "Transcribe this audio file accurately. Identify different speakers if possible, but mainly focus on capturing the spoken content word-for-word." }
        ]);

        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Transcription error:", error);
        throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
}

module.exports = {
    transcribeAudio
};
