 # Deployment Guide

This guide covers how to deploy the Audio Summary API to your Digital Ocean server (`167.71.232.107`) and configure it with a custom domain using Cloudflare.

## 1. Preparation

Ensure your Digital Ocean server has Docker and Docker Compose installed (which it likely does since you run n8n).

## 2. Server Setup

SSH into your server:
```bash
ssh root@167.71.232.107
```

### Option A: Clone from Git (Recommended)
If you have pushed this code to a Git repository:

1.  Clone the repo:
    ```bash
    git clone <your-repo-url> audio-summarizer
    cd audio-summarizer
    ```

### Option B: Direct Copy
If you are working locally and want to copy files directly:

```bash
# From your local machine
scp -r "src" "package.json" "Dockerfile" "docker-compose.yml" ".env.example" root@167.71.232.107:/root/audio-summarizer
```

## 3. Configuration

1.  Navigate to the project directory on your server:
    ```bash
    cd /root/audio-summarizer
    ```

2.  Create the `.env` file:
    ```bash
    cp .env.example .env
    nano .env
    ```

3.  **Critical**: Update the `.env` file with your **Google AI API Key**.
    ```env
    GOOGLE_AI_API_KEY=your_actual_api_key
    PORT=3005  # Change this if port 3000 is occupied by n8n or other services
    ```
    *Note: We recommend using port **3005** or similar to avoid conflicts with common services.*

4.  Update `docker-compose.yml` if you changed the port in `.env`:
    ```bash
    # The docker-compose.yml is already set up to use ${PORT:-3000}, so strictly speaking you just need to set PORT in .env
    ```

## 4. Start the Service

Build and start the container:

```bash
docker-compose up -d --build
```

Check logs to ensure it's running:
```bash
docker-compose logs -f
```

## 5. Cloudflare & Nginx Setup

Since you use Cloudflare, you likely want to map a domain (e.g., `api.yourdomain.com`) to this service.

### Step 5.1: Cloudflare DNS
1.  Log in to Cloudflare.
2.  Go to your domain's DNS settings (`isaee.xyz`).
3.  Add an **A Record**:
    -   **Name**: `api` (creates `api.isaee.xyz`)
    -   **IPv4 Address**: `167.71.232.107`
    -   **Proxy status**: Proxied (Orange Cloud)

### Step 5.2: Nginx Configuration (Reverse Proxy)

Assuming you have Nginx running on your Digital Ocean server (common with n8n setups).

1.  Create a new Nginx configuration file:
    ```bash
    nano /etc/nginx/sites-available/audio-summarizer
    ```

2.  Paste the following configuration (replace `api.yourdomain.com` and `3005` with your actual values):

    ```nginx
    server {
        listen 80;
        server_name api.isaee.xyz;  # You can use a subdomain like api.isaee.xyz

        location / {
            proxy_pass http://localhost:3005; # Make sure this matches your PORT
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  Enable the site and restart Nginx:
    ```bash
    ln -s /etc/nginx/sites-available/audio-summarizer /etc/nginx/sites-enabled/
    nginx -t
    systemctl restart nginx
    ```

4.  **SSL/TLS**: Since you are using Cloudflare, ensure your SSL/TLS encryption mode in Cloudflare is set to **Full** or **Flexible**.
    -   If using **Full**, you might need a self-signed cert on the server or use Let's Encrypt (`certbot`).
    -   For simplest setup with Cloudflare "Proxied" (Orange cloud), standard Port 80 on backend is fine if Cloudflare handles SSL on the edge (Flexible), but **Full (Strict)** with a real cert is more secure.

    *Recommendation*: Run `certbot --nginx -d api.isaee.xyz` if you have Certbot installed to get a free SSL cert, then set Cloudflare to **Full (Strict)**.

## 6. Usage with n8n

Now you can use this API in your n8n workflows!

**HTTP Request Node:**
-   **Method**: POST
-   **URL**: `https://api.isaee.xyz/api/summarize-audio`
-   **Example `curl` command**:
    ```bash
    curl -X POST https://api.isaee.xyz/api/summarize-audio \
      -H "Content-Type: application/json" \
      -d '{"url": "https://www.instagram.com/reel/..."}'
    ```
-   **Body**: JSON
    ```json
    {
      "url": "https://www.instagram.com/reel/..."
    }
    ```

The API will return the summary which you can then send to Slack, Email, or save to Notion/Google Docs.
