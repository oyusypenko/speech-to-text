#!/bin/bash

# Script for checking NVIDIA GPU and Docker GPU support

echo "🔍 Checking system requirements for Speech-to-Text..."
echo ""

# Function to check command
check_command() {
    if command -v "$1" &> /dev/null; then
        echo "✅ $1 is installed"
        return 0
    else
        echo "❌ $1 not found"
        return 1
    fi
}

# Check Docker
echo "📦 Checking Docker..."
check_command docker
docker_status=$?

if [ $docker_status -eq 0 ]; then
    docker_version=$(docker --version)
    echo "   Version: $docker_version"
fi

# Check Docker Compose
echo ""
echo "🐳 Checking Docker Compose..."
if check_command docker-compose; then
    docker_compose_version=$(docker-compose --version)
    echo "   Version: $docker_compose_version"
elif docker compose version &> /dev/null; then
    echo "✅ docker compose (built-in) available"
    docker_compose_version=$(docker compose version)
    echo "   Version: $docker_compose_version"
else
    echo "❌ Docker Compose not found"
fi

# Check NVIDIA GPU
echo ""
echo "🎮 Checking NVIDIA GPU..."

# Check nvidia-smi
if command -v nvidia-smi &> /dev/null; then
    echo "✅ nvidia-smi found"
    
    # Get GPU information
    gpu_info=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$gpu_info" ]; then
        echo "📊 Detected GPUs:"
        echo "$gpu_info" | while IFS=',' read -r name memory; do
            name=$(echo "$name" | xargs)
            memory=$(echo "$memory" | xargs)
            echo "   - $name (${memory}MB VRAM)"
        done
        gpu_available=1
    else
        echo "⚠️ NVIDIA drivers not working correctly"
        gpu_available=0
    fi
else
    echo "❌ nvidia-smi not found"
    gpu_available=0
fi

# Check NVIDIA Docker
echo ""
echo "🐋 Checking NVIDIA Docker support..."

if docker info 2>/dev/null | grep -q "nvidia"; then
    echo "✅ NVIDIA Docker runtime available"
    nvidia_docker=1
elif docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA Docker support working"
    nvidia_docker=1
else
    echo "❌ NVIDIA Docker support unavailable"
    nvidia_docker=0
fi

# Export variables for use by other scripts
export GPU_AVAILABLE=$gpu_available
export NVIDIA_DOCKER=$nvidia_docker

# Create configuration file
cat > /tmp/gpu-check-result.env << EOF
GPU_AVAILABLE=$gpu_available
NVIDIA_DOCKER=$nvidia_docker
EOF

echo ""
echo "📋 Startup recommendations:"

if [ $gpu_available -eq 1 ] && [ $nvidia_docker -eq 1 ]; then
    echo "🚀 GPU mode: Use docker-compose.yml (full performance)"
    echo "   Command: make start"
    recommended_mode="gpu"
elif [ $gpu_available -eq 0 ]; then
    echo "💻 CPU mode: No GPU detected, use CPU version"
    echo "   Command: make start-cpu"
    echo "   ⚠️ Transcription will be slower"
    recommended_mode="cpu"
else
    echo "🔧 Setup required: GPU found but Docker support missing"
    echo "   Install nvidia-docker2 for GPU acceleration"
    echo "   Or use CPU mode: make start-cpu"
    recommended_mode="cpu"
fi

# Save recommended mode
echo "RECOMMENDED_MODE=$recommended_mode" >> /tmp/gpu-check-result.env

echo ""
echo "💡 Startup mode saved to /tmp/gpu-check-result.env"

# Return status
if [ $docker_status -eq 0 ]; then
    exit 0
else
    exit 1
fi