# 🚀 Speech-to-Text Quick Start

## Prerequisites

### Required:
1. **Docker & Docker Compose** installed
2. **8GB+ RAM** free memory
3. **10GB+ disk space**

### Optional (for maximum performance):
4. **NVIDIA GPU** with CUDA support
5. **NVIDIA Docker runtime** (nvidia-docker2)

> ⚠️ **System works WITHOUT GPU!** If you don't have an NVIDIA graphics card, the system will automatically switch to CPU mode.

## 1️⃣ Clone and Launch

```bash
# Clone repository
git clone <repository-url>
cd speech-to-text

# Check system requirements
make check-gpu

# Automatic launch (recommended)
make start
```

### Alternative launch methods:

**Force GPU mode:**
```bash
make start-gpu
```

**Force CPU mode:**
```bash
make start-cpu
```

**Using scripts directly:**
```bash
./scripts/start.sh      # Auto-detection
```

## 2️⃣ Verify Operation

After launch, the system will be available at:

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:3001
- 🎙️ **WhisperX Service**: http://localhost:8000

### Automatic check:
```bash
make test
# or
./scripts/test.sh
```

## 3️⃣ Usage

1. Open http://localhost:3000 in your browser
2. Select an audio or video file
3. Configure language and model (optional)
4. Click "Upload" or drag and drop the file
5. Wait for transcription to complete
6. Download the result

## 4️⃣ Supported Formats

### Audio
- MP3, WAV, MP4, OGG, WebM, M4A

### Video  
- MP4, MPEG, MOV, AVI, WebM, WMV

### Limitations
- Maximum file size: **500MB**
- Supported languages: **80+ languages**

## 5️⃣ Operating Modes

### 🚀 GPU Mode (Recommended)
- **Requirements**: NVIDIA GPU + CUDA + nvidia-docker2
- **Performance**: ~2-5x faster than real-time
- **Models**: All supported (tiny, base, small, medium, large)

### 💻 CPU Mode
- **Requirements**: Docker only (works everywhere!)
- **Performance**: 0.5-1x real-time speed
- **Models**: All supported (recommended tiny/base)

> 💡 The system automatically detects the available mode and configures itself accordingly!

## 6️⃣ Management Commands

```bash
make start       # Automatic launch
make start-gpu   # Force GPU
make start-cpu   # Force CPU
make stop        # Stop  
make restart     # Restart
make logs        # Show logs
make test        # Test
make check-gpu   # Check GPU
make clean       # Full cleanup
```

## 🛠️ Troubleshooting

### System won't start
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs

# Restart
make restart
```

### WhisperX is slow
- Ensure NVIDIA GPU is available
- Use a lighter model (tiny/base)
- Check: `nvidia-smi`

### File upload errors
- File must be <500MB
- Check supported formats
- Ensure sufficient free space

## 📊 Monitoring

### Queue status:
```bash
curl http://localhost:3001/api/jobs/admin/queue-status
```

### Service health:
```bash
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```

### Real-time logs:
```bash
docker-compose logs -f
```

## 🔧 Production Launch

```bash
# Copy config
cp .env.production.example .env.production

# Edit variables
nano .env.production

# Launch in production mode
make prod
```

## 💡 Useful Links

- [Full Documentation](README.md)
- [API Documentation](http://localhost:3001/api/health)
- [Configuration](docker-compose.yml)

## 🆘 Get Help

1. Check [README.md](README.md)
2. Run `make test` for diagnostics
3. View logs: `make logs`
4. Create an issue in the repository

---

🎉 **Ready!** The system should be working at http://localhost:3000