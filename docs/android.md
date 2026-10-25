# Android 端（Capacitor 壳）

Folia 的安卓端基于 Capacitor 打包：Web 构建产物跑在安卓 WebView 里，原生层提供
媒体通知、后台保活与系统栏适配。桌面 Electron 能力（壁纸模式、mods 面板、原生模糊等）
在安卓壳里天然关闭——代码里所有 `window.electron` 访问都有守卫，缺桥时自动走 Web 分支。

## 构建

依赖：Node >= 24、JDK 17+（Gradle 8.14 不支持 Java 26，建议 JDK 21）、Android SDK
（platform 36 + build-tools 35/36）。

```bash
npm run cap:sync            # vite build + cap sync android
npm run build:android       # 上一步 + gradlew assembleDebug
npm run build:android:release
```

产物在 `android/app/build/outputs/apk/`。`android/local.properties` 指向本机 SDK
（`sdk.dir=<path>`），已被 gitignore。

开发调试：`npx cap run android`（连接设备/模拟器），或 Android Studio 打开 `android/`。
`capacitor.config.ts` 里开着 `webContentsDebuggingEnabled`，可用 chrome://inspect 调试 WebView。

## 与桌面端 / Web 端的差异

- **平台判定**：`src/utils/platform.ts` 的 `isNativeApp` / `isAndroidApp` 基于
  `window.Capacitor.isNativePlatform()`，仅在原生壳内为 true；移动浏览器 PWA 场景不受影响。
- **视口**：`index.html` 使用 `viewport-fit=cover` + 禁用缩放（与拖拽手势冲突）。
  安卓 15+（targetSdk 36）默认 edge-to-edge，内容延伸到系统栏下面；
  UI 需要避开刘海/手势条时用 `src/index.css` 暴露的 `--safe-area-*` 变量。
- **媒体通知与后台播放**：`src/hooks/useMediaSessionBridge.ts` 统一走
  `@capgo/capacitor-media-session`。浏览器端它是对 `navigator.mediaSession` 的透明包装
  （行为与原实现一致）；安卓端落到原生 `MediaSessionService`——系统媒体通知、锁屏控制，
  并以前台服务保活后台播放。
- **API base**：安卓壳内没有同源后端（WebView 静态服务在 `https://localhost`）。
  `src/services/runtimeConfig.ts` 新增 `getApiBaseUrl()`：优先读
  `window.__FOLIA_RUNTIME_CONFIG__.apiBaseUrl`，其次构建变量 `VITE_API_BASE_URL`，
  默认空串（同源，浏览器行为不变）。歌词/封面代理、AI 主题、分词等 `/api/*` 调用点
  都已接入。部署侧相应给 `/api/*` 加了 CORS（回显 Origin + OPTIONS 预检，
  `api-ts/cors.ts` / `worker/cors.ts`）。
- **在线音乐后端（网易云嵌入运行）**：安卓壳默认**不需要任何后端**——
  `@neteasecloudmusicapienhanced/api` 的模块函数直接打进 WebView JS bundle
  （`src/services/neteaseEmbedded.ts`），Node 内建依赖经 `src/shims/netease-node/` 补齐
  （crypto→crypto-js/@noble/zlib 的同步 shim、zlib→pako、fs/os/path→内存虚拟文件、
  axios→CapacitorHttp 原生请求以绕开 CORS）。端点在 `netease.ts` 的 `fetchWithCreds`
  内按 `isNativeApp && 未配置外部实例` 自动切换。已知限制：
  - `unblock=true` 的灰歌解锁不可用（unblockmusic-utils 依赖 Node 文件系统）；
  - `playlist_subscribe`（收藏歌单）依赖易盾反作弊 token（jsdom），不可用；
  - 反作弊/加密链与桌面同源，但协议层无签名校验兜底，网易云接口变更时需同步升级依赖。
  如需改用外部部署（Vercel/Docker 实例），构建时传 `VITE_NETEASE_API_BASE` 即可，
  嵌入模式自动让位。
- **QQ / 酷狗**：仍需显式配置后端（`VITE_QQ_API_BASE` / `VITE_KUGOU_API_BASE`），
  未配置时入口可见但不可用。
- **http scheme**：`capacitor.config.ts` 里 `androidScheme: 'http'` 是有意为之——
  QQ/酷狗等外部后端是局域网明文 HTTP 时，https 页面里的 fetch 会被 WebView 混合内容
  策略整单拦截（`usesCleartextTraffic` 管不到页面内发起的混合内容请求），http 页面
  不受影响。代价是非安全上下文：PWA Service Worker 不可用（原生壳里本来也不需要），
  媒体会话桥已放宽为原生环境直接可用（`useMediaSessionBridge` 的 `canUseMediaSession`）。
  注意 `http://localhost` 仍是 Chromium 可信上下文，WebCrypto 等不受影响；
  升级 APK 后如出现旧资源加载，清一次应用数据（pm clear）即可——
  PWA 预缓存在旧 scheme 残留时可能短期接管。
- **不适用功能**：壁纸模式、OBS 桥、mods 本地文件、桌面快捷键、歌词页原生模糊。
  这些全部由 `window.electron` 守卫，壳内自动隐藏或降级，无需在安卓侧做开关。

## 指向自部署实例

安卓 APK 想要完整在线能力时，构建前指定一个 Folia 部署（自部署 Vercel/Docker，
或任何已应用本项目 CORS 改动的实例）：

```bash
VITE_API_BASE_URL=https://your-folia.example.com npm run cap:sync
```

或改动 `android/app/src/main/assets/public/runtime-config.js`（cap sync 会覆盖，
建议走构建变量）：

```js
window.__FOLIA_RUNTIME_CONFIG__ = { apiBaseUrl: 'https://your-folia.example.com' };
```

## 已知限制

- WebView 的 Service Worker / PWA 缓存与原生资源打包并存，离线行为以 PWA 那套为准。
- 桌面通知、Discord RPC 等纯 Electron 能力未做原生等价物。
- 首帧仍有应用内 splash（HTML 层），未接 Android 12+ 系统 splash screen API。
