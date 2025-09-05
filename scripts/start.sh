#!/bin/bash

echo "🚀 Starting Speech-to-Text system..."

# Check that Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads temp

# Check GPU and determine startup mode
echo "🔍 Checking system requirements..."
./scripts/check-gpu.sh > /tmp/gpu-check.log 2>&1

# Load check result
if [ -f /tmp/gpu-check-result.env ]; then
    source /tmp/gpu-check-result.env
else
    echo "⚠️ Could not determine GPU configuration. Using CPU mode."
    RECOMMENDED_MODE="cpu"
fi

echo "🎯 Determined mode: $RECOMMENDED_MODE"

# Start with appropriate profile
if [ "$RECOMMENDED_MODE" = "gpu" ]; then
    echo "🚀 Starting in GPU mode..."
    docker-compose --profile gpu up -d
elif [ "$RECOMMENDED_MODE" = "cpu" ]; then
    echo "💻 Starting in CPU mode..."
    docker-compose --profile cpu up -d
else
    echo "🔧 Automatic mode detection..."
    # Try GPU mode, fall back to CPU on error
    if docker-compose --profile gpu up -d 2>/dev/null; then
        echo "✅ GPU mode started successfully"
    else
        echo "⚠️ GPU mode failed, switching to CPU..."
        docker-compose --profile cpu up -d
    fi
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo "🔍 Checking service status..."
docker-compose ps

# Check API health
echo "🏥 Checking Backend API health..."
until curl -s http://localhost:3001/api/health > /dev/null; do
  echo "⏳ Waiting for Backend API..."
  sleep 5
done

echo "🏥 Checking WhisperX service health..."
until curl -s http://localhost:8000/health > /dev/null; do
  echo "⏳ Waiting for WhisperX service..."
  sleep 5
done

echo "✅ All services started!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "🎙️ WhisperX Service: http://localhost:8000"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: ./scripts/stop.sh"