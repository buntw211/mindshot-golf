# MindShot Golf — iOS App Setup Guide

## One-time setup on your Mac

### 1. Install prerequisites
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (if not already installed)
brew install node

# Install Cocoapods (required for iOS)
sudo gem install cocoapods
```

### 2. Install Xcode
Download Xcode from the Mac App Store (free, ~7GB).
After installing, open it once to accept the license.

### 3. Download this project to your Mac
Download or git clone this project onto your Mac.

Then install dependencies:
```bash
npm install
```

### 4. Set your deployed server URL
Edit the `.env.mobile` file and replace the placeholder with your real deployed Replit URL:
```
VITE_API_BASE_URL=https://your-real-app.replit.app
```

Your deployed URL is the one you see when you open your published Replit app.

### 5. Build the web app for mobile
```bash
chmod +x build-mobile.sh
./build-mobile.sh
```

This builds the frontend with the correct server URL and syncs it into the iOS project.

### 6. Open in Xcode
```bash
npx cap open ios
```

This opens the iOS project in Xcode.

### 7. In Xcode
1. Select your development team (requires Apple Developer Account — $99/year)
2. Change the Bundle Identifier if needed (currently `com.mindshot.golf`)
3. Connect your iPhone or use the simulator
4. Press the Play button to test

### 8. Submit to the App Store
When ready:
1. In Xcode: Product → Archive
2. Follow the prompts to upload to App Store Connect
3. Fill in your app listing at appstoreconnect.apple.com
4. Submit for review (usually 1-3 days)

## Updating the app
Whenever you make changes in Replit:
1. Run `./build-mobile.sh` again
2. That automatically syncs to the iOS project
3. Re-archive and submit from Xcode

## Notes
- Your backend stays on Replit — the iOS app just calls your deployed server
- Authentication uses Replit OIDC — this opens a browser window for sign-in on mobile (works, but can be upgraded to a native flow later)
- In-app purchases (Apple) can be added later via RevenueCat once the app is live
