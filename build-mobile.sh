#!/bin/bash
# MindShot Golf — Mobile Build Script
# Run this on your Mac to build and sync the iOS app.
#
# Usage: ./build-mobile.sh

set -e

echo "🏌️ Building MindShot Golf for iOS..."

# Load mobile env vars and build the web app
export $(cat .env.mobile | grep -v '^#' | xargs)
npx vite build

echo "✅ Web app built. Syncing to iOS..."
npx cap sync ios

echo "✅ Done! Run 'npx cap open ios' to open in Xcode."
