#!/bin/bash

echo "🛑 Stopping Speech-to-Text system..."

# Stop all containers
docker-compose down

echo "🧹 Cleanup (optional)..."
echo "For full cleanup (including volumes) run:"
echo "docker-compose down -v --remove-orphans"
echo ""
echo "To remove images:"
echo "docker-compose down --rmi all"

echo "✅ System stopped."