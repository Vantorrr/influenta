#!/bin/bash
set -e

echo "🚀 Railway Start Script"
echo "📁 Current directory: $(pwd)"
echo "📂 Listing files:"
ls -la

echo "🔍 Looking for dist directory..."
if [ -d "dist" ]; then
    echo "✅ dist directory found"
    echo "📂 Contents of dist:"
    ls -la dist/
    
    if [ -f "dist/main.js" ]; then
        echo "✅ main.js found"
        echo "🚀 Starting application..."
        exec node dist/main.js
    else
        echo "❌ main.js not found in dist"
        echo "📂 Available files in dist:"
        ls -la dist/
        exit 1
    fi
else
    echo "❌ dist directory not found"
    echo "🔨 Running build..."
    npm run build
    
    if [ -f "dist/main.js" ]; then
        echo "✅ Build successful, starting app..."
        exec node dist/main.js
    else
        echo "❌ Build failed or main.js not created"
        exit 1
    fi
fi
