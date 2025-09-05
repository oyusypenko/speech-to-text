# 🏗️ Speech-to-Text System Architecture

## 📋 System Overview

The system represents a microservice architecture for transcribing audio and video files using WhisperX.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │ WhisperX Service│
│   (Next.js)     │◄──►│  (Node.js)      │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        │
                       ┌─────────────────┐             │
                       │   PostgreSQL    │             │
                       │   Port: 5432    │             │
                       └─────────────────┘             │
                              │                        │
                              ▼                        │
                       ┌─────────────────┐             │
                       │     Redis       │             │
                       │   Port: 6379    │             │
                       └─────────────────┘             │
                              │                        │
                              ▼                        │
                       ┌─────────────────┐             │
                       │     BullMQ      │             │
                       │  (Job Queue)    │◄────────────┘
                       └─────────────────┘
```

## 🔧 System Components

### 1. Frontend (Next.js + TypeScript)
**Location:** `frontend/`
**Port:** 3000

**Main Functions:**
- User interface for file uploads
- Display transcription status
- Download results
- Real-time job status updates

**Key Components:**
- `FileUpload.tsx` - File upload component with drag & drop
- `JobsList.tsx` - Job list with live updates
- `api.ts` - API client for backend interaction

### 2. Backend API (Node.js + Express + TypeScript)
**Location:** `backend/`
**Port:** 3001

**Main Functions:**
- REST API for job management
- File upload processing
- BullMQ queue management
- PostgreSQL interaction

**Architecture:**
```
src/
├── controllers/     # API controllers
├── models/         # Data models (PostgreSQL)
├── services/       # Business logic
├── routes/         # API routes
├── middleware/     # Express middleware
├── config/         # DB/Redis configuration
└── types/          # TypeScript types
```

**API Endpoints:**
- `POST /api/jobs/upload` - File upload
- `GET /api/jobs` - Job list  
- `GET /api/jobs/:id` - Job details
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/:id/download` - Download transcription

### 3. WhisperX Service (Python + FastAPI)
**Location:** `whisper-service/`
**Port:** 8000

**Main Functions:**
- Audio/video transcription using WhisperX
- Automatic language detection
- Text alignment
- GPU/CPU optimization

**Key Features:**
- Support for multiple Whisper models
- Model caching in memory
- Automatic memory cleanup
- Batch processing for optimization

### 4. PostgreSQL Database
**Порт:** 5432

**Schema:**
```sql
jobs (
  id UUID PRIMARY KEY,
  original_filename VARCHAR(255),
  file_path VARCHAR(500),
  file_type ENUM('audio', 'video'),
  file_size BIGINT,
  status ENUM('pending', 'processing', 'completed', 'failed'),
  transcription_text TEXT,
  transcription_file_path VARCHAR(500),
  language VARCHAR(10),
  model VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT
)
```

### 5. Redis + BullMQ
**Порт:** 6379

**Functions:**
- Job queue management
- Retry logic for failed jobs
- Job prioritization
- Performance monitoring

## 🔄 Data Flow

1. **File Upload:**
   ```
   Frontend → Backend API → PostgreSQL (create job)
                ↓
           BullMQ Queue (add transcription job)
   ```

2. **Job Processing:**
   ```
   BullMQ Worker → WhisperX Service → File System
        ↓              ↓                   ↓
   PostgreSQL    Transcription       Save result
   (update status)   Processing
   ```

3. **Result Retrieval:**
   ```
   Frontend → Backend API → PostgreSQL → File System
        ↑                      ↓              ↓
   Display result    Get job details   Read file
   ```

## 🐳 Docker Containers

### Base Images:
- **Frontend**: `node:18-alpine` + Next.js standalone
- **Backend**: `node:18-alpine` + compiled TypeScript
- **WhisperX**: `nvidia/cuda:12.1-devel-ubuntu22.04` + Python
- **PostgreSQL**: `postgres:15-alpine`
- **Redis**: `redis:7-alpine`

### Volumes:
- `postgres_data` - Database
- `redis_data` - Redis persistence
- `whisper_models` - WhisperX model cache
- `./uploads` - Uploaded files
- `./temp` - Temporary files

### Networks:
- `speech-network` - Internal communication

## 📊 Scaling

### Horizontal Scaling:
1. **Frontend**: Multiple instances behind load balancer
2. **Backend**: Stateless API, easily scalable
3. **WhisperX**: Increase number of workers
4. **BullMQ**: Distributed queues

### Vertical Scaling:
1. **PostgreSQL**: More RAM for cache
2. **Redis**: More memory for queues
3. **WhisperX**: More powerful GPUs

## 🔒 Security

### Security Layers:
1. **Network**: Internal Docker network
2. **Authentication**: Ready for JWT integration
3. **File Upload**: Type and size validation
4. **CORS**: Configured for frontend domain
5. **Rate Limiting**: Middleware ready

### Production Recommendations:
- HTTPS with SSL certificates
- Secrets management (Docker secrets/Kubernetes)
- Database encryption
- File encryption for sensitive data

## 📈 Monitoring and Logging

### Built-in Capabilities:
- Health checks for all services
- Structured logging in JSON format
- BullMQ dashboard for queues
- PostgreSQL query logging

### Integrations:
- **Prometheus** metrics (ready for integration)
- **Grafana** dashboards
- **Sentry** error tracking
- **ELK Stack** for centralized logging

## 🚀 Deployment

### Local Development:
```bash
docker-compose up -d
```

### Production:
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Kubernetes:
Ready for conversion to Kubernetes manifests

## ⚡ Performance

### Optimizations:
- Connection pooling for PostgreSQL
- Redis for fast data access
- GPU acceleration for WhisperX
- Streaming for large files
- Compression for API responses

### Benchmarks:
- **Tiny model**: ~5x faster than real-time
- **Base model**: ~2x faster than real-time  
- **Large model**: ~0.5x of real-time (very accurate)
- **Memory usage**: ~2-8GB depending on model