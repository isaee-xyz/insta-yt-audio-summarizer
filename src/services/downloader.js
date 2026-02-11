const YtDlpWrap = require('yt-dlp-wrap').default;
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Initialize yt-dlp
const ytDlpWrap = new YtDlpWrap();

/**
 * Download audio from a YouTube Short or Instagram Reel URL
 * @param {string} url - The video URL
 * @param {string} outputDir - Directory to save the audio
 * @returns {Promise<string>} - Path to the downloaded audio file
 */
async function downloadAudio(url, outputDir) {
    return new Promise(async (resolve, reject) => {
        try {
            const fileId = uuidv4();
            const rawOutputPath = path.join(outputDir, `${fileId}_raw`);
            const finalOutputPath = path.join(outputDir, `${fileId}.mp3`);

            // Check if URL is supported (basic check)
            if (!url.includes('youtube.com') && !url.includes('youtu.be') && !url.includes('instagram.com')) {
                return reject(new Error('Unsupported URL. Please provide a YouTube Shorts or Instagram Reels URL.'));
            }

            console.log(`Downloading video from: ${url}`);

            // Download audio using yt-dlp
            // We download best audio and convert to mp3
            const command = [
                url,
                '-x', // Extract audio
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '-o', path.join(outputDir, `${fileId}.%(ext)s`),
                '--no-playlist'
            ];

            // For Instagram, we might need cookies or specific user agent in some cases, 
            // but yt-dlp handles most public reels well.

            let downloadedPath = '';

            const readableStream = ytDlpWrap.exec(command)
                .on('progress', (progress) => {
                    // console.log(progress.percent, progress.totalSize, progress.currentSpeed, progress.eta);
                })
                .on('ytDlpEvent', (eventType, eventData) => {
                    // console.log(eventType, eventData);
                    // Try to capture the filename
                    if (eventData.includes('[ExtractAudio] Destination:')) {
                        const match = eventData.match(/Destination: (.+)/);
                        if (match && match[1]) {
                            downloadedPath = match[1];
                        }
                    } else if (eventData.includes('[ffmpeg] Destination:')) {
                        const match = eventData.match(/Destination: (.+)/);
                        if (match && match[1]) {
                            downloadedPath = match[1];
                        }
                    }
                })
                .on('error', (error) => {
                    reject(error);
                })
                .on('close', () => {
                    // If we didn't capture the path from logs, construct it based on expected behavior
                    if (!downloadedPath || !fs.existsSync(downloadedPath)) {
                        downloadedPath = finalOutputPath;
                    }

                    if (fs.existsSync(downloadedPath)) {
                        resolve(downloadedPath);
                    } else {
                        // Fallback check for any file with that ID
                        const files = fs.readdirSync(outputDir);
                        const match = files.find(f => f.startsWith(fileId));
                        if (match) {
                            resolve(path.join(outputDir, match));
                        } else {
                            reject(new Error('Download failed: Output file not found'));
                        }
                    }
                });

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Get video metadata (title, duration, etc.)
 * @param {string} url 
 */
async function getVideoMetadata(url) {
    try {
        const metadata = await ytDlpWrap.getVideoInfo(url);
        return {
            title: metadata.title,
            duration: metadata.duration,
            uploader: metadata.uploader,
            description: metadata.description
        };
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return { title: 'Unknown Video' };
    }
}

module.exports = {
    downloadAudio,
    getVideoMetadata
};
