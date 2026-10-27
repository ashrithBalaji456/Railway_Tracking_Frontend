import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.railwaytracking.app',
  appName: 'Railway Tracking',
  webDir: 'dist',
  server: {
    url: 'https://railway-tracking-frontend.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
