# Audio Summary API (Insta-YT-Audio-Download)

A dockerized REST API service that downloads audio from Instagram Reels and YouTube Shorts, transcribes the content using **Gemini 3 Flash**, and generates AI-powered summary notes in markdown format.

## Features

- **Audio Download**: Supports Instagram Reels and YouTube Shorts.
- **Transcription**: Native audio transcription using Google's Gemini 3 Flash model.
- **Summarization**: Generates structured markdown summaries with key points and actionable insights.
- **Dockerized**: Easy to deploy using Docker and Docker Compose.
- **API First**: Simple REST API for integration with other tools (like n8n).

## Prerequisites

- Docker & Docker Compose
- Google AI API Key (Gemini 3 Flash)

## Quick Start

1.  **Clone the repository**
2.  **Configure Environment**
    ```bash
    cp .env.example .env
    # Edit .env and add your GOOGLE_AI_API_KEY
    ```
3.  **Run with Docker**
    ```bash
    docker-compose up -d --build
    ```
4.  **Test the API**
    ```bash
    ```bash
    curl -X POST http://localhost:3000/api/process \
      -H "Content-Type: application/json" \
      -d '{"url": "YOUR_VIDEO_URL_HERE"}'
    ```

    **Production:**
    ```bash
    curl -X POST https://api.isaee.xyz/api/process \
      -H "Content-Type: application/json" \
      -d '{"url": "YOUR_VIDEO_URL_HERE"}'
    ```

## API Documentation

### POST /api/process

**Request Body:**
```json
{
  "url": "https://www.youtube.com/shorts/..."
}
```

**Response:**
```json
{
  "success": true,
  "metadata": {
    "title": "Video Title",
    "duration": 60,
    "uploader": "Channel Name"
  },
  "transcript": "Full text transcript...",
  "summary": "# Summary\n\n## Key Points\n- Point 1..."
}
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to Digital Ocean with Cloudflare.
