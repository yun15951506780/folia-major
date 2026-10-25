// 当前文件：读取 Docker 注入的 Web 运行时配置，并兼容既有 Vite 构建变量。

export type WebAiProvider = 'gemini' | 'openai';

const normalizeAiProvider = (value: unknown): WebAiProvider => (
    value === 'openai' ? 'openai' : 'gemini'
);

export const getWebAiProvider = (): WebAiProvider => {
    if (typeof window !== 'undefined') {
        const runtimeValue = window.__FOLIA_RUNTIME_CONFIG__?.aiProvider;
        if (runtimeValue) return normalizeAiProvider(runtimeValue);
    }

    return normalizeAiProvider(import.meta.env.VITE_AI_PROVIDER);
};

// 同源 /api/* 之外的服务端 base。桌面 Electron 不需要它（桥接直连），浏览器部署走同源
// （返回空串，路径原样）。安卓壳里 WebView 服务在 https://localhost 上，没有后端，
// 必须由 runtime-config.js 或构建变量指到一个真实部署，否则歌词代理与 AI 端点全部落空。
const normalizeBase = (value: unknown): string => (
    String(value ?? '').trim().replace(/\/+$/, '')
);

export const getApiBaseUrl = (): string => {
    if (typeof window !== 'undefined') {
        const runtimeValue = normalizeBase(window.__FOLIA_RUNTIME_CONFIG__?.apiBaseUrl);
        if (runtimeValue) return runtimeValue;
    }

    return normalizeBase(import.meta.env.VITE_API_BASE_URL);
};
