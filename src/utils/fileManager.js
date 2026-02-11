const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

/**
 * Clean up files in the temp directory that are older than a certain age
 * @param {string} tempDir - Path to temp directory
 * @param {number} maxAgeMs - Max age in milliseconds (default: 1 hour)
 */
async function cleanupTempFiles(tempDir, maxAgeMs = 3600000) {
    try {
        if (!fs.existsSync(tempDir)) return;

        const files = await readdirAsync(tempDir);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(tempDir, file);
            try {
                const stats = await statAsync(filePath);
                if (now - stats.mtimeMs > maxAgeMs) {
                    await unlinkAsync(filePath);
                    console.log(`Cleaned up old temp file: ${file}`);
                }
            } catch (err) {
                console.error(`Error processing file ${file} for cleanup:`, err);
            }
        }
    } catch (err) {
        console.error('Error cleaning up temp files:', err);
    }
}

/**
 * Delete a specific file safely
 * @param {string} filePath - Path to file to delete
 */
async function deleteFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            await unlinkAsync(filePath);
        }
    } catch (err) {
        console.error(`Error deleting file ${filePath}:`, err);
    }
}

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

module.exports = {
    cleanupTempFiles,
    deleteFile,
    ensureDir
};
