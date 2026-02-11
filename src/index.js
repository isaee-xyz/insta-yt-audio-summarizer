require('dotenv').config();
const express = require('express');
const path = require('path');
const { downloadAudio, getVideoMetadata } = require('./services/downloader');
const { transcribeAudio } = require('./services/transcriber');
const { generateSummary } = require('./services/summarizer');
const { cleanupTempFiles, deleteFile, ensureDir } = require('./utils/fileManager');

const app = express();
const port = process.env.PORT || 3000;
const TEMP_DIR = process.env.TEMP_DIR || path.join(__dirname, '../temp');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure temp directory exists
ensureDir(TEMP_DIR);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Audio Summary API', timestamp: new Date().toISOString() });
});

// Process endpoint
app.post('/api/summarize-audio', async (req, res) => {
    const { url } = req.body;
    let audioPath = null;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log(`Processing URL: ${url}`);

        // 1. Download Audio
        console.log('Step 1: Downloading audio...');
        const metadata = await getVideoMetadata(url);
        audioPath = await downloadAudio(url, TEMP_DIR);
        console.log(`Audio downloaded to: ${audioPath}`);

        // 2. Transcribe Audio
        console.log('Step 2: Transcribing audio...');
        // Note: Gemini supports up to 20MB for audio files directly. 
        // For larger files, we might need to split or upload differently.
        // Assuming shorts/reels are small enough.
        const transcript = await transcribeAudio(audioPath);
        console.log('Transcription complete.');

        // 3. Generate Summary
        console.log('Step 3: Generating summary...');
        const summary = await generateSummary(transcript, metadata);
        console.log('Summary generated.');

        // Cleanup
        await deleteFile(audioPath);

        res.json({
            success: true,
            metadata: {
                title: metadata.title,
                duration: metadata.duration,
                uploader: metadata.uploader
            },
            summary
        });

    } catch (error) {
        console.error('Processing error:', error);

        // Cleanup on error
        if (audioPath) {
            await deleteFile(audioPath);
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Scheduled cleanup (every hour)
setInterval(() => {
    cleanupTempFiles(TEMP_DIR);
}, 3600000);

app.listen(port, () => {
    console.log(`Audio Summary API listening on port ${port}`);
});
