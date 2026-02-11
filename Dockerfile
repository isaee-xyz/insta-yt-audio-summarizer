FROM node:18-alpine

# Install system dependencies
# python3 and py3-pip are required for yt-dlp
# ffmpeg is required for audio processing
# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    ca-certificates \
    curl

# Remove existing yt-dlp if present (from previous layers or base images) and install strict latest via pip
RUN rm -rf /usr/local/bin/yt-dlp && \
    pip3 install --no-cache-dir --break-system-packages --upgrade yt-dlp

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
