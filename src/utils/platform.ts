// src/utils/platform.ts
// One place to answer "is this a Mac", so keyboard handling and the shortcut hints the user reads
// can never disagree about it. Detection is by user agent because the renderer runs both in a
// browser and in Electron, and `window.electron?.platform` only exists in the latter.

export const isMacPlatform = typeof navigator !== 'undefined'
    && navigator.userAgent.toLowerCase().includes('mac');

/**
 * The modifier a shortcut declared as `ctrl` actually uses here: Cmd on macOS, Ctrl elsewhere.
 * Shortcuts are declared once with `ctrl` and translated at the point of use, rather than each
 * declaration carrying a per-platform variant.
 */
export const isPrimaryModifierPressed = (event: KeyboardEvent): boolean => (
    isMacPlatform ? event.metaKey : event.ctrlKey
);

/** The modifier that must stay *up* for a primary-modifier shortcut to be unambiguous. */
export const isSecondaryModifierPressed = (event: KeyboardEvent): boolean => (
    isMacPlatform ? event.ctrlKey : event.metaKey
);

/** Label for the primary modifier, for shortcut hints shown in the UI. */
export const PRIMARY_MODIFIER_LABEL = isMacPlatform ? 'Cmd' : 'Ctrl';

// ---- Capacitor 安卓壳检测 ----
// 安卓壳里 WebView 的 UA 不含 "android" 以外的桌面特征，直接用 Capacitor 的原生桥判断，
// 避免和普通移动浏览器（PWA 场景）混淆：isNativeApp 仅在打包的安卓/iOS 壳里为 true。
const capacitorGlobal = (typeof window !== 'undefined')
    ? (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor
    : undefined;

/** 是否运行在 Capacitor 打包的原生壳内（安卓 APK / iOS），浏览器与 Electron 均为 false。 */
export const isNativeApp = typeof capacitorGlobal?.isNativePlatform === 'function'
    && capacitorGlobal.isNativePlatform();

/** 原生壳内的平台名（'android' | 'ios'）；非原生壳返回 undefined。 */
export const nativeAppPlatform = isNativeApp && typeof capacitorGlobal?.getPlatform === 'function'
    ? capacitorGlobal.getPlatform()
    : undefined;

/** 是否运行在安卓原生壳内。用于关闭纯桌面能力（壁纸模式、快捷键提示等）并启用移动端布局。 */
export const isAndroidApp = nativeAppPlatform === 'android';
