#!/bin/bash

echo "🚀 Starting NutriConnect POC..."

# Check if ports are available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 3000 is already in use"
    exit 1
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 3001 is already in use" 
    exit 1
fi

# Start both frontend and backend
npm run dev
