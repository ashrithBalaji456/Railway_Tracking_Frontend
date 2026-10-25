import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.railwaytracking.app',
  appName: 'Railway Tracking',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
