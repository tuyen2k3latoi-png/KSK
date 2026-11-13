export interface CapacitorProjectConfig {
  appId: string;
  appName: string;
  webDir: string;
  server: {
    androidScheme: 'https';
    cleartext: boolean;
  };
  plugins: {
    LocalNotifications: {
      smallIcon: string;
      iconColor: string;
    };
  };
}

const config: CapacitorProjectConfig = {
  appId: 'vn.vitapulse.health',
  appName: 'VitaPulse',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_vitapulse',
      iconColor: '#0F766E',
    },
  },
};

export default config;
