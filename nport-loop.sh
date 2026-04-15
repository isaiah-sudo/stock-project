#!/bin/bash

while true; do
  echo "Starting NPort tunnel..."
  nport 4000 -s trillium-finance

  echo "Tunnel ended. Restarting in 5 seconds..."
  sleep 5
done
