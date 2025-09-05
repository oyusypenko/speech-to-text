.PHONY: help build start start-gpu start-cpu stop restart logs test clean dev prod check-gpu

# Default target
help:
	@echo "Speech-to-Text System Commands:"
	@echo ""
	@echo "  start       - Start system (auto GPU detection)"
	@echo "  start-gpu   - Force start with GPU"
	@echo "  start-cpu   - Force start CPU only"
	@echo "  stop        - Stop the entire system"
	@echo "  restart     - Restart the system"
	@echo "  build       - Build Docker images"
	@echo "  logs        - Show logs for all services"
	@echo "  test        - Test the system"
	@echo "  clean       - Full cleanup (including volumes)"
	@echo "  check-gpu   - Check GPU availability"
	@echo "  dev         - Start in development mode"
	@echo "  prod        - Start in production mode"
	@echo ""

# Check GPU availability
check-gpu:
	@./scripts/check-gpu.sh

# Start the system (auto-detect mode)
start:
	@./scripts/start.sh

# Force GPU mode
start-gpu:
	@echo "🚀 Force starting in GPU mode..."
	@docker-compose --profile gpu up -d
	@./scripts/test.sh

# Force CPU mode
start-cpu:
	@echo "💻 Force starting in CPU mode..."
	@docker-compose --profile cpu up -d
	@./scripts/test.sh

# Stop the system
stop:
	@echo "🛑 Stopping system..."
	@docker-compose --profile gpu --profile cpu down

# Restart the system
restart: stop start

# Build Docker images
build:
	@echo "🏗️ Building Docker images..."
	@docker-compose build

# Show logs
logs:
	@docker-compose logs -f --tail=50

# Test the system
test:
	@./scripts/test.sh

# Clean everything
clean:
	@echo "🧹 Full system cleanup..."
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@echo "✅ Cleanup completed"

# Development mode
dev:
	@echo "🛠️ Starting in development mode..."
	@docker-compose up --build

# Production mode
prod:
	@echo "🏭 Starting in production mode..."
	@docker-compose -f docker-compose.production.yml up -d
	@echo "✅ Production system started"