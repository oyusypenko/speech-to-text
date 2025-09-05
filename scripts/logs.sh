#!/bin/bash

if [ $# -eq 0 ]; then
    echo "📋 Showing logs for all services..."
    docker-compose logs -f --tail=50
else
    echo "📋 Showing logs for service: $1"
    docker-compose logs -f --tail=50 "$1"
fi