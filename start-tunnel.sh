#!/bin/bash
# start-tunnel.sh

set -e

# Default port is 4000 for the backend, and we request a random subdomain first. 
# We'll use a specific subdomain if the user wants it, but for reliability we default to picking one.
# For simplicity, we just run npx localtunnel
echo "Starting nport tunnel to expose your backend to the internet..."
echo "This tunnel URL must match NEXT_PUBLIC_API_BASE_URL in your deployed frontend."
echo ""
nport 4000 -s trillium-finance
#still used