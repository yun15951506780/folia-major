// src/services/aiDirectClient.ts
// 安卓壳等无后端环境的设备端 AI 直连：用户在设置里填 key（存 localStorage），
// 请求从 WebView 直接发往模型商。协议与桌面版 electron/aiTextClient.cjs 一致
// （Gemini generateContent / OpenAI-compatible chat.completions），只是从主进程
// 搬到了浏览器 fetch——两个端点都允许跨源调用。
import type { DualTheme } from '../types';
import { applyStoredAnimationIntensityToDualTheme } from './themePreferences';
import { sanitizeDualTheme } from './themeSanitizer';

const GEMINI_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
const DEFAULT_OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_OPENAI_MODEL = 'gpt-5.6-luna';
const DEFAULT_OPENAI_TEMPERATURE = '0.7';
const AI_TIMEOUT_MS = 120_000;

// localStorage 读写独立成小函数：设置界面与请求路径共用同一份存储。
const LS_KEY = 'folia.aiDirect';

type AiDirectSettings = {
    provider: 'gemini' | 'openai';
    geminiApiKey: string;
    openaiApiKey: string;
    openaiApiUrl: string;
    openaiModel: string;
    openaiTemperature: string;
};

const DEFAULT_SETTINGS: AiDirectSettings = {
    provider: 'gemini',
    geminiApiKey: '',
    openaiApiKey: '',
    openaiApiUrl: '',
    openaiModel: '',
    openaiTemperature: '',
};

export const loadAiDirectSettings = (): AiDirectSettings => {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };
        return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AiDirectSettings>) };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
};

export const saveAiDirectSettings = (settings: AiDirectSettings): void => {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(settings));
    } catch {
        // localStorage 不可用时静默失败
    }
};

export const isAiDirectConfigured = (): boolean => {
    const s = loadAiDirectSettings();
    return s.provider === 'gemini' ? Boolean(s.geminiApiKey.trim()) : Boolean(s.openaiApiKey.trim());
};

const timeoutSignal = (): AbortSignal => {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(AI_TIMEOUT_MS);
    }
    const controller = new AbortController();
    setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    return controller.signal;
};

// OpenAI-compatible 端点的归一化与桌面版相同：裸域补 /v1/chat/completions，带路径的只补尾段。
const normalizeOpenAiUrl = (raw: string): string => {
    const trimmed = raw.trim() || DEFAULT_OPENAI_CHAT_COMPLETIONS_URL;
    try {
        const parsed = new URL(trimmed);
        if (!parsed.pathname || parsed.pathname === '/') {
            parsed.pathname = '/v1/chat/completions';
        } else if (!parsed.pathname.endsWith('/chat/completions')) {
            parsed.pathname = `${parsed.pathname.replace(/\/$/, '')}/chat/completions`;
        }
        return parsed.toString();
    } catch {
        return DEFAULT_OPENAI_CHAT_COMPLETIONS_URL;
    }
};

// 与 api-ts/generate-theme.ts 相同的响应清理兜底：模型偶尔输出 markdown 包裹的 JSON。
const parseThemeJson = (content: string): DualTheme => {
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
    }
    return sanitizeDualTheme(JSON.parse(jsonStr));
};

export const generateThemeDirect = async (
    lyricsText: string,
    options?: { isPureMusic?: boolean; songTitle?: string },
): Promise<DualTheme> => {
    const settings = loadAiDirectSettings();
    const snippet = lyricsText.slice(0, 2000);
    const { buildThemeSourcePrompt, THEME_GENERATION_PROMPT_PREFIX } = await import('../utils/aiThemePrompts');

    const sourcePrompt = buildThemeSourcePrompt(snippet, Boolean(options?.isPureMusic), options?.songTitle);
    const systemPrompt = THEME_GENERATION_PROMPT_PREFIX;

    let content: string;
    if (settings.provider === 'gemini') {
        if (!settings.geminiApiKey.trim()) throw new Error('Gemini API Key 未配置');
        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': settings.geminiApiKey.trim(),
            },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: sourcePrompt }] }],
                generationConfig: { responseMimeType: 'application/json' },
            }),
            signal: timeoutSignal(),
        });
        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`Gemini API 错误: ${response.status}${errText ? ` - ${errText.slice(0, 200)}` : ''}`);
        }
        const data = await response.json();
        content = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
    } else {
        if (!settings.openaiApiKey.trim()) throw new Error('OpenAI API Key 未配置');
        const model = settings.openaiModel.trim() || DEFAULT_OPENAI_MODEL;
        const temperature = Number.parseFloat(settings.openaiTemperature.trim() || DEFAULT_OPENAI_TEMPERATURE);
        const response = await fetch(normalizeOpenAiUrl(settings.openaiApiUrl), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${settings.openaiApiKey.trim()}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: sourcePrompt },
                ],
                temperature: Number.isFinite(temperature) ? temperature : 0.7,
                response_format: { type: 'json_object' },
            }),
            signal: timeoutSignal(),
        });
        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`AI 接口错误: ${response.status}${errText ? ` - ${errText.slice(0, 200)}` : ''}`);
        }
        const data = await response.json();
        content = data?.choices?.[0]?.message?.content ?? '';
    }

    if (!content) throw new Error('AI 未返回内容');
    const dualTheme = parseThemeJson(content);
    dualTheme.light.fontStyle = 'sans';
    dualTheme.light.provider = settings.provider === 'gemini' ? 'Google Gemini' : 'OpenAI Compatible';
    dualTheme.dark.fontStyle = 'sans';
    dualTheme.dark.provider = dualTheme.light.provider;
    return applyStoredAnimationIntensityToDualTheme(dualTheme);
};
