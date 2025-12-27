# Keep-Alive Scripts for Render

These scripts prevent your Render service from spinning down due to inactivity on the free tier.

## How It Works

Render's free tier spins down services after 15 minutes of inactivity. These scripts ping your server every 14 minutes to keep it active.

## Available Solutions

### 1. Built-in Self-Ping (Recommended)

The server automatically pings itself when deployed to Render. **No external script needed!**

**Setup:**
1. Add this environment variable in your Render dashboard:
   ```
   RENDER_SERVICE_URL=https://your-service-name.onrender.com
   ```

2. The server will automatically start pinging itself every 14 minutes.

### 2. External Keep-Alive Scripts

Run these scripts on your local machine or another always-on server.

#### Windows PowerShell

```powershell
# Set your Render URL
$env:RENDER_SERVICE_URL = "https://your-service-name.onrender.com"

# Run the script
.\keep-alive.ps1
```

Or edit [keep-alive.ps1](keep-alive.ps1) and replace `YOUR_RENDER_URL_HERE` with your actual URL.

#### Linux/Mac (Bash)

```bash
# Make the script executable
chmod +x keep-alive.sh

# Set your Render URL
export RENDER_SERVICE_URL="https://your-service-name.onrender.com"

# Run the script
./keep-alive.sh
```

Or edit [keep-alive.sh](keep-alive.sh) and replace `YOUR_RENDER_URL_HERE` with your actual URL.

#### Node.js Script

```bash
# From the server directory
cd server

# Set your Render URL
export RENDER_SERVICE_URL="https://your-service-name.onrender.com"

# Run the script
node keep-alive.js
```

## Running Scripts in Background

### Windows (PowerShell)

To run in background and keep it running after closing terminal:

```powershell
Start-Process powershell -ArgumentList "-File keep-alive.ps1" -WindowStyle Hidden
```

### Linux/Mac (Bash)

```bash
# Using nohup
nohup ./keep-alive.sh > keep-alive.log 2>&1 &

# Or using screen
screen -dmS keepalive ./keep-alive.sh

# Or using tmux
tmux new -d -s keepalive './keep-alive.sh'
```

## Using External Services (Free Alternatives)

Instead of running scripts locally, you can use free monitoring services:

1. **UptimeRobot** (https://uptimerobot.com)
   - Free plan: 50 monitors, 5-minute intervals
   - Add your `/api/health` endpoint

2. **Cron-Job.org** (https://cron-job.org)
   - Free plan: unlimited jobs
   - Set to run every 14 minutes

3. **Better Uptime** (https://betteruptime.com)
   - Free plan available

4. **GitHub Actions** (included in repo)
   - Runs automatically every 14 minutes
   - No setup needed if you push to GitHub

## Health Check Endpoint

Your server now has a health check endpoint:

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T10:30:00.000Z",
  "uptime": 3600
}
```

## Troubleshooting

**Script not working?**
- Verify your RENDER_SERVICE_URL is correct
- Make sure it starts with `https://`
- Check that `/api/health` endpoint is accessible
- Look for error messages in the script output

**Server still spinning down?**
- Render's free tier has limitations
- Consider upgrading to a paid plan for 24/7 availability
- The self-ping works best when set up correctly

## Important Notes

- ⚠️ **Free Tier Limits**: Render's free tier has 750 hours/month. Keep-alive uses those hours.
- ⚠️ **Multiple Services**: If running multiple free services, you may hit the monthly limit.
- ✅ **Best Practice**: Use the built-in self-ping (Solution #1) - it's the most reliable.

## Cost-Free Alternatives

If you want truly free, always-on hosting:
- **Railway** (500 hours/month free)
- **Fly.io** (free tier available)
- **Vercel** (for frontend, serverless functions)
- **Netlify** (for frontend, serverless functions)
