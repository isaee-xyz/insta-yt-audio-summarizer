const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Generate a summary from text using Gemini
 * @param {string} transcript - The text transcript to summarize
 * @param {object} metadata - Optional metadata about the video
 * @returns {Promise<string>} - Markdown formatted summary
 */
async function generateSummary(transcript, metadata = {}) {
    try {
        if (!process.env.GOOGLE_AI_API_KEY) {
            throw new Error("GOOGLE_AI_API_KEY is not set");
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

        const MAX_SUMMARY_LENGTH = 1950;

        const defaultPrompt = "Please provide a comprehensive summary of the following audio transcript. Extract key points, actionable insights, and main topics. Format the output as clean markdown.";
        const promptTemplate = process.env.SUMMARY_PROMPT || defaultPrompt;

        const context = metadata.title ? `Video Title: ${metadata.title}\n` : '';
        const fullPrompt = `${promptTemplate}\n\nIMPORTANT: Your entire response MUST be under ${MAX_SUMMARY_LENGTH} characters. Be concise.\n\n${context}Transcript:\n${transcript}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let summary = response.text();

        // Hard limit: truncate at last complete line if over limit
        if (summary.length > MAX_SUMMARY_LENGTH) {
            summary = summary.substring(0, MAX_SUMMARY_LENGTH);
            const lastNewline = summary.lastIndexOf('\n');
            if (lastNewline > MAX_SUMMARY_LENGTH * 0.5) {
                summary = summary.substring(0, lastNewline);
            }
        }

        return summary;

    } catch (error) {
        console.error("Summarization error:", error);
        throw new Error(`Failed to generate summary: ${error.message}`);
    }
}

module.exports = {
    generateSummary
};
