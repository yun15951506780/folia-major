// capacitor.config.ts
// Android 壳（Capacitor）配置。webDir 指向 vite 构建产物；
// androidScheme 用 http：在线音乐后端是局域网明文 HTTP（如 http://<ip>:3300），
// https 页面里 fetch 会被混合内容策略整单拦截，http 页面则不受影响。
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'top.cielaniska.folia',
  appName: 'Folia',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#09090b',
  },
  server: {
    androidScheme: 'http',
  },
};

export default config;
