#!/bin/bash

echo "🧪 Testing Speech-to-Text system..."

# Function to check HTTP status
check_service() {
    local url=$1
    local service_name=$2
    
    echo "🔍 Checking $service_name: $url"
    
    if curl -s -f "$url" > /dev/null; then
        echo "✅ $service_name is running"
        return 0
    else
        echo "❌ $service_name is unavailable"
        return 1
    fi
}

# Check that all containers are running
echo "📊 Container status:"
docker-compose ps

echo ""

# Service checks
echo "🔍 Checking service availability..."

check_service "http://localhost:3000" "Frontend (Next.js)"
frontend_status=$?

check_service "http://localhost:3001/api/health" "Backend API"
backend_status=$?

check_service "http://localhost:8000/health" "WhisperX Service"
whisperx_status=$?

# Database check
echo "🗄️ Checking PostgreSQL connection..."
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
    db_status=0
else
    echo "❌ PostgreSQL is unavailable"
    db_status=1
fi

# Redis check
echo "📡 Checking Redis connection..."
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
    redis_status=0
else
    echo "❌ Redis is unavailable"
    redis_status=1
fi

echo ""
echo "📈 Test results:"
echo "Frontend: $([ $frontend_status -eq 0 ] && echo "✅ OK" || echo "❌ FAIL")"
echo "Backend API: $([ $backend_status -eq 0 ] && echo "✅ OK" || echo "❌ FAIL")"
echo "WhisperX: $([ $whisperx_status -eq 0 ] && echo "✅ OK" || echo "❌ FAIL")"
echo "PostgreSQL: $([ $db_status -eq 0 ] && echo "✅ OK" || echo "❌ FAIL")"
echo "Redis: $([ $redis_status -eq 0 ] && echo "✅ OK" || echo "❌ FAIL")"

# Overall status
total_fails=$((frontend_status + backend_status + whisperx_status + db_status + redis_status))

if [ $total_fails -eq 0 ]; then
    echo ""
    echo "🎉 All services are working correctly!"
    echo "🌐 System available at: http://localhost:3000"
    exit 0
else
    echo ""
    echo "⚠️ Issues detected with $total_fails services."
    echo "📋 Check logs: docker-compose logs"
    exit 1
fi