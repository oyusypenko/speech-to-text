# Speech-to-Text Transcription System

A full-featured audio and video transcription system using WhisperX.

## 🏗️ Architecture

The system consists of the following components:

- **Frontend**: Next.js application with TypeScript and Tailwind CSS
- **Backend**: Node.js API with Express, PostgreSQL and BullMQ
- **WhisperX Service**: Python service for transcription
- **PostgreSQL**: Database for storing jobs
- **Redis**: For managing BullMQ queues

## 🚀 Quick Start

### Prerequisites

**Minimum (for CPU mode):**
- Docker and Docker Compose
- 8GB RAM
- 10GB free disk space

**Recommended (for GPU mode):**
- NVIDIA GPU with CUDA support
- NVIDIA Docker runtime (nvidia-docker2)

> 🎉 **System works without GPU!** Automatically switches between GPU and CPU modes.

### System Launch

1. Clone the repository:
```bash
git clone <repository-url>
cd speech-to-text
```

2. Check system requirements (optional):
```bash
make check-gpu
```

3. Start the system:
```bash
make start          # Automatic mode
# or
make start-gpu      # Force GPU mode
# or  
make start-cpu      # Force CPU mode
```

4. Open browser and go to http://localhost:3000

### Check Service Status

```bash
# Check all containers
docker-compose ps

# Check logs
docker-compose logs -f

# Check API health
curl http://localhost:3001/api/health
```

## 📁 Project Structure

```
speech-to-text/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # App Router structure
│   │   ├── components/   # React components
│   │   ├── lib/         # API client and utilities
│   │   └── types/       # TypeScript types
│   └── Dockerfile
├── backend/               # Node.js API
│   ├── src/
│   │   ├── controllers/ # API controllers
│   │   ├── models/      # Data models
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API routes
│   │   └── middleware/  # Express middleware
│   └── Dockerfile
├── whisper-service/       # Python WhisperX service
│   ├── main.py          # FastAPI application
│   ├── requirements.txt
│   └── Dockerfile
├── postgres/              # PostgreSQL configuration
│   └── init.sql         # Database initialization
└── docker-compose.yml     # Docker Compose configuration
```

## 🔧 API Endpoints

### Backend API (Port 3001)

- `GET /api/health` - Service health check
- `POST /api/jobs/upload` - Upload file for transcription
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get specific job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/:id/download` - Download transcription file

### WhisperX Service (Port 8000)

- `GET /health` - Service health check
- `POST /transcribe` - Transcribe audio file

## 🎛️ Configuration

### Environment Variables

Copy `.env.example` files to `.env` for each service and configure them:

```bash
# Backend
cp backend/.env.example backend/.env

# WhisperX Service
cp whisper-service/.env.example whisper-service/.env
```

### Supported File Formats

**Audio:**
- MP3, WAV, MP4, OGG, WebM, M4A

**Video:**
- MP4, MPEG, MOV, AVI, WebM, WMV

**Maximum size:** 500MB

### WhisperX Models

Available models (in order of accuracy):
- `tiny` - Fastest, least accurate
- `base` - Balanced (default)
- `small` - More accurate
- `medium` - Very accurate
- `large` - Maximum accuracy, slow

## 🛠️ Development

### Development Mode

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev

# WhisperX Service
cd whisper-service
pip install -r requirements.txt
python main.py
```

### Database

PostgreSQL starts automatically with initialization script `postgres/init.sql`.

### Queues

BullMQ is used for asynchronous transcription job processing. Redis is required for queue operations.

## 📊 Monitoring

### Check Queue Status

```bash
curl http://localhost:3001/api/jobs/admin/queue-status
```

### Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f whisper-service
```

## 🔒 Security

- All services use non-root users
- File size limits (500MB)
- CORS configured for frontend
- Helmet middleware for API security

## 🧪 Testing

### API Testing

```bash
# Health check
curl http://localhost:3001/api/health

# File upload
curl -X POST -F "file=@test.mp3" -F "model=base" -F "language=ru" \
  http://localhost:3001/api/upload
```

## 🚨 Troubleshooting

### Common Issues

1. **WhisperX Service won't start**
   - Ensure nvidia-docker2 is installed
   - Check NVIDIA GPU availability: `nvidia-smi`
   - For CPU-only systems, use: `make start-cpu`

2. **Slow transcription**
   - Use lighter model (tiny/base)
   - Ensure GPU is being used
   - Check system resources

3. **File upload errors**
   - Check file size (<500MB)
   - Verify supported format
   - Ensure sufficient disk space

### Logs and Debugging

```bash
# Detailed logs
docker-compose logs -f --tail=100

# Resource monitoring
docker stats

# Restart service
docker-compose restart whisper-service
```

## 📈 Performance

### Operating Modes

**🚀 GPU Mode (Recommended)**
- Requirements: NVIDIA GPU + CUDA + nvidia-docker2
- Performance: ~2-5x faster than real-time
- All models supported

**💻 CPU Mode (Universal)**
- Requirements: Docker only
- Performance: 0.5-1x real-time speed
- Recommended models: tiny, base

> 💡 System automatically detects available mode and optimizes accordingly!

### Performance Tips
- Use NVIDIA GPU for acceleration
- Model `base` is optimal for most cases
- Batch size configured automatically
- Memory cleanup after each transcription

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details.
