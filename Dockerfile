FROM node:18-alpine

# Install system dependencies
# python3 and py3-pip are required for yt-dlp
# ffmpeg is required for audio processing
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    ca-certificates \
    curl

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create temp directory
RUN mkdir -p temp && chown -R node:node temp

# Expose port
EXPOSE 3000

# Switch to non-root user
USER node

# Start command
CMD [ "npm", "start" ]
