#!/bin/bash
# Keep-Alive Script for Render Service
# Pings your server every 14 minutes to prevent it from spinning down

# Configuration
SERVICE_URL="${RENDER_SERVICE_URL:-YOUR_RENDER_URL_HERE}"
PING_INTERVAL_MINUTES=14
HEALTH_ENDPOINT="/api/health"

echo -e "\033[32mKeep-Alive Script Started\033[0m"
echo -e "\033[36mTarget: $SERVICE_URL\033[0m"
echo -e "\033[36mInterval: $PING_INTERVAL_MINUTES minutes\033[0m"
echo -e "\033[33mPress Ctrl+C to stop\033[0m"
echo ""

ping_server() {
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    url="${SERVICE_URL}${HEALTH_ENDPOINT}"
    
    echo "[$timestamp] Pinging $url..."
    
    if response=$(curl -s -w "\n%{http_code}" --max-time 10 "$url" 2>&1); then
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "200" ]; then
            echo -e "[$timestamp] \033[32m✓ Ping successful! Status: $http_code\033[0m"
        else
            echo -e "[$timestamp] \033[33m⚠ Unexpected status: $http_code\033[0m"
        fi
    else
        echo -e "[$timestamp] \033[31m✗ Ping failed\033[0m"
    fi
    
    echo ""
}

# Initial ping
ping_server

# Loop indefinitely with interval
while true; do
    sleep $((PING_INTERVAL_MINUTES * 60))
    ping_server
done
