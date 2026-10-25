// src/shims/netease-node/cookieBridge.ts
// 原生 CookieBridge 插件的 TS 封装：读取 WebView 持久化 cookie 库里
// 指定域名的 Cookie 请求头字符串（"k=v; k=v"）。仅原生壳内可用。
import { registerPlugin } from '@capacitor/core';

export interface CookieBridgePluginInterface {
    getCookie(options: { url: string }): Promise<{ cookie: string }>;
}

export const CookieBridge = registerPlugin<CookieBridgePluginInterface>('CookieBridge');
