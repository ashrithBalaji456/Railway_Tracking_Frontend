import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.railwaytracking.app',
  appName: 'Railway Tracking',
  webDir: 'dist',
  server: {
    // Commented out remote Vercel URL so Capacitor loads the fresh local bundled assets directly from the APK
    // url: 'https://railway-tracking-frontend.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
