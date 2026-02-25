# 🚀 Deploy SENTINEL.SAT on Render

## 📋 Prerequisites

1. **GitHub Repository** - Push your code to GitHub
2. **HuggingFace Token** - Get API token from HuggingFace
3. **ESP32 Camera** - Optional, for live video stream

## 🎯 Deployment Steps

### 1. Prepare Repository

```bash
# Make build script executable
chmod +x render-build.sh

# Commit all changes
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Render Web Service

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure settings:

#### Basic Settings:
- **Name**: `sentinel-sat-backend`
- **Environment**: `Python`
- **Region**: Choose nearest region
- **Branch**: `main`

#### Build Settings:
- **Build Command**: `./render-build.sh`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Environment Variables:
```bash
HF_TOKEN=Bearer hf_your_huggingface_token_here
ESP_STREAM_URL=http://your-esp32-ip:81/stream
SUPABASE_URL=your_supabase_url  # optional
SUPABASE_KEY=your_supabase_key  # optional
```

### 3. Configure HuggingFace

1. Go to [HuggingFace](https://huggingface.co/settings/tokens)
2. Create new token with **read** permissions
3. Add token to Render environment variables:
   ```
   HF_TOKEN=Bearer hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 4. Deploy!

Click **"Create Web Service"** and wait for deployment.

## 🔧 Post-Deployment

### Access Your App:
- **Main App**: `https://sentinel-sat-backend.onrender.com`
- **API Health**: `https://sentinel-sat-backend.onrender.com/api/health`
- **Video Stream**: `https://sentinel-sat-backend.onrender.com/stream`

### Test the System:
1. Open the main URL in browser
2. Check if frontend loads with animated particles
3. Test source switching (ESP32 ↔ NASA)
4. Verify AI analysis results

## 🛠️ Troubleshooting

### Common Issues:

#### 1. Build Fails
```bash
# Check render-build.sh permissions
chmod +x render-build.sh
```

#### 2. Frontend Not Loading
- Check if `/static/index.html` exists
- Verify build logs in Render dashboard

#### 3. HuggingFace API Errors
- Verify HF_TOKEN is correct
- Check token has proper permissions
- Monitor API rate limits

#### 4. ESP32 Connection Issues
- Verify ESP_STREAM_URL is accessible
- Check ESP32 is streaming MJPEG
- Test ESP32 stream locally first

### Debug Commands:
```bash
# Check build logs
curl https://sentinel-sat-backend.onrender.com/api/health

# Test video stream
curl -I https://sentinel-sat-backend.onrender.com/stream

# Test AI analysis
curl https://sentinel-sat-backend.onrender.com/api/latest
```

## 📊 Monitoring

### Render Dashboard:
- **Metrics**: CPU, Memory, Response times
- **Logs**: Build and runtime logs
- **Events**: Deployments and restarts

### Health Checks:
- Automatic health check at `/api/health`
- Render auto-restarts on failures
- Manual restart available in dashboard

## 🔄 Updates

To update the application:
1. Push changes to GitHub
2. Render auto-deploys (if enabled)
3. Or manually deploy from dashboard

## 💡 Tips

1. **Use Custom Domain** - Add your domain in Render settings
2. **Environment Variables** - Keep secrets secure
3. **Rate Limiting** - Monitor HuggingFace API usage
4. **Backups** - Enable automatic backups in Render

## 🎉 Success!

Your SENTINEL.SAT system is now live on Render! 🌍✨

- **Frontend**: React with animated particles
- **Backend**: FastAPI with YOLO AI analysis  
- **AI**: HuggingFace YOLO model
- **Video**: ESP32 camera streaming
- **Deployment**: Fully automated on Render
