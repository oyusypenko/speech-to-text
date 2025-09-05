# 📊 Performance Guide

## 🏎️ System Operating Modes

### GPU Mode (Recommended)

**Requirements:**
- NVIDIA GPU (GTX 1060 / RTX 2060 or newer)
- CUDA 11.0+ 
- 4GB+ VRAM
- nvidia-docker2

**Performance:**
| Model | Processing Time | Quality | VRAM |
|-------|-----------------|---------|------|
| tiny   | 5-10x faster   | ⭐⭐     | 1GB  |
| base   | 3-5x faster    | ⭐⭐⭐    | 1GB  |
| small  | 2-3x faster    | ⭐⭐⭐⭐   | 2GB  |
| medium | 1-2x faster    | ⭐⭐⭐⭐⭐  | 5GB  |
| large  | 1x real-time    | ⭐⭐⭐⭐⭐  | 8GB  |

### CPU Mode (Universal)

**Requirements:**
- Any CPU (recommended 4+ cores)
- 8GB+ RAM
- Docker only

**Performance:**
| Model | Processing Time | Quality | RAM  |
|-------|------------------|---------|------|
| tiny   | 0.5-1x speed | ⭐⭐     | 2GB  |
| base   | 0.3-0.5x        | ⭐⭐⭐    | 4GB  |
| small  | 0.2-0.3x        | ⭐⭐⭐⭐   | 6GB  |
| medium | 0.1-0.2x        | ⭐⭐⭐⭐⭐  | 8GB  |
| large  | 0.05-0.1x       | ⭐⭐⭐⭐⭐  | 12GB |

> 💡 **Example**: 10-minute file
> - GPU (base): processing ~2-3 minutes
> - CPU (base): processing ~20-30 minutes

## 🔧 Performance Optimization

### For GPU mode:

1. **Update NVIDIA drivers**
```bash
# Check version
nvidia-smi

# Recommended version 470+
```

2. **Check CUDA compatibility**
```bash
# Check CUDA
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

3. **Choose optimal model**
- `base` - optimal speed/quality balance
- `small` - if quality is important
- `tiny` - for maximum speed

### For CPU mode:

1. **Increase Docker allocated memory**
```bash
# In Docker Desktop: Settings -> Resources -> Memory -> 8GB+
```

2. **Use lightweight models**
- `tiny` - for fast processing
- `base` - maximum for CPU mode
- Avoid `medium/large` on CPU

3. **Close other applications**
- Free RAM for transcription
- Stop resource-intensive processes

## 📈 Benchmarks

### Test system:
- **GPU**: RTX 3060 (8GB VRAM)
- **CPU**: Intel i7-10700K (8 cores)
- **RAM**: 32GB DDR4

### Results for 10-minute audio:

| Mode     | Model | Time    | Quality WER* |
|----------|-------|---------|---------------|
| GPU      | tiny  | 1.2 min | 15%          |
| GPU      | base  | 2.1 min | 8%           |
| GPU      | small | 3.8 min | 5%           |
| CPU      | tiny  | 18 min  | 15%          |
| CPU      | base  | 45 min  | 8%           |

*WER = Word Error Rate (lower is better)

## ⚡ Performance Tips

### 🎯 Model Selection

**For podcasts/interviews:**
- GPU: `base` or `small`
- CPU: `tiny` or `base`

**For music with vocals:**
- GPU: `small` or `medium`
- CPU: `base`

**For lectures/presentations:**
- GPU: `base`
- CPU: `tiny`

### 📁 File Optimization

1. **Convert to WAV/MP3**
```bash
# Use ffmpeg for conversion
ffmpeg -i input.mov -vn -acodec libmp3lame -ab 128k output.mp3
```

2. **Reduce quality for speed**
- 16kHz sample rate is sufficient
- Mono instead of stereo
- 128kbps bitrate

3. **Split long files**
- Files < 30 minutes process faster
- Parallel processing of multiple short files

### 🔄 Resource Monitoring

```bash
# Monitor GPU
watch nvidia-smi

# Monitor Docker containers
docker stats

# Performance logs
docker logs speech-whisper -f
```

## 🚨 Performance Troubleshooting

### GPU mode slower than expected:

1. **Check GPU usage**
```bash
nvidia-smi
# GPU Utilization should be 80-100%
```

2. **Thermal throttling**
- Check GPU temperature (<80°C)
- Improve system cooling

3. **VRAM overflow**
- Use smaller model
- Close other GPU applications

### CPU mode very slow:

1. **Insufficient RAM**
```bash
# Increase Docker limits
docker update --memory=8g speech-whisper-cpu
```

2. **CPU overload**
- Close other applications
- Use `tiny` model

3. **Swap usage**
- Add physical RAM
- Optimize swap settings

## 📋 Mode Recommendations

### When to use GPU:
✅ Have NVIDIA GPU  
✅ Need high speed  
✅ Processing large volumes  
✅ Accuracy is critical  

### When to use CPU:
✅ No NVIDIA GPU  
✅ Episodic processing  
✅ Limited budget  
✅ Simple tasks (podcasts)  

### When to use cloud:
✅ Very large volumes  
✅ Professional processing  
✅ Need additional features  
✅ Reliability is critical