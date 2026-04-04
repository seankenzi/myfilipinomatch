
## Native Mobile App Setup with Capacitor

### What I'll do in Lovable:
1. **Install Capacitor dependencies** (@capacitor/core, @capacitor/cli, @capacitor/ios, @capacitor/android)
2. **Initialize Capacitor** with your project config
3. **Configure capacitor.config.ts** with hot-reload for development

### What you'll need to do on your machine:
1. **Export to GitHub** via the button in Lovable
2. **Git clone** the repo locally
3. Run `npm install`
4. Run `npx cap add ios` and/or `npx cap add android`
5. Run `npm run build && npx cap sync`
6. Open in **Xcode** (for iOS) or **Android Studio** (for Android)
7. Build and submit to App Store / Play Store

### Prerequisites you'll need:
- **For iOS**: A Mac with Xcode, Apple Developer account ($99/year)
- **For Android**: Android Studio, Google Developer account ($25 one-time)

### Current app readiness ✅
- Mobile-first responsive UI
- Touch-friendly 44-48px targets
- Safe area inset support for notched devices
- No PWA service worker conflicts (already cleaned up)

Shall I proceed?
