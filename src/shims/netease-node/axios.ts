// src/shims/netease-node/axios.ts
// axios 的 CapacitorHttp 适配层：请求从 WebView 发到 music.163.com 属于跨源，
// 页面内 fetch/XHR 会被 CORS 拦截，所以走 Capacitor 原生 HTTP（无 CORS 概念）。
// 响应形态对齐 request.js 的消费方式：
//   - res.data：文本时为 string，responseType 'arraybuffer' 时为 Buffer
//   - res.headers['set-cookie']：原生层会把多条 Set-Cookie 用 ", " 拼接，
//     这里按“逗号后紧跟 token=”切回数组，并剥掉 Expires 内的逗号干扰
import { CapacitorHttp } from '@capacitor/core';
import { Buffer } from 'buffer';
import './global';

const KNOWN_COOKIE_NAME = /^(MUSIC_[A-Z_]+|__csrf|__remember_me|NMTID|_ntes_nuid|_ntes_nnid|WNMCID|WEVNSM|ntes_kaola_ad|os|osver|appver|buildver|channel|deviceId|sDeviceId|push_token|flash|username)=/;

// 拆分被 ", " 连接的多条 Set-Cookie：逗号后紧跟「白名单内 cookie 名=」才算新条目，
// Expires（Fri, 12 Mar 2027）里的逗号后面是空格+数字，不会误切。
const splitSetCookie = (joined: string): string[] => {
    const parts: string[] = [];
    let current = '';
    for (const segment of joined.split(',')) {
        const candidate = current ? `${current},${segment}` : segment;
        if (current && KNOWN_COOKIE_NAME.test(segment.trim())) {
            parts.push(current.trim());
            current = segment;
        } else {
            current = candidate;
        }
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
};

type AxiosSettings = {
    url: string;
    method?: string;
    headers?: Record<string, unknown>;
    data?: unknown;
    timeout?: number;
    responseType?: string;
};

const axios = async (settings: AxiosSettings) => {
    const method = (settings.method || 'GET').toUpperCase() as
        | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    const headers: Record<string, string> = {};
    Object.entries(settings.headers || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) headers[key] = String(value);
    });
    // 原生层自动处理压缩与长度，这两个头交给系统
    delete headers['content-length'];
    delete headers['Content-Length'];
    delete headers['accept-encoding'];
    delete headers['Accept-Encoding'];

    // Node 版 axios 会给字符串 body 自动补 urlencoded Content-Type，
    // 原生层不做这件事，而网易接口缺它就回空响应体。
    if (method !== 'GET' && typeof settings.data === 'string'
        && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const isBinary = settings.responseType === 'arraybuffer';
    const response = await CapacitorHttp.request({
        url: settings.url,
        method,
        headers,
        data: typeof settings.data === 'string' ? settings.data : undefined,
        connectTimeout: settings.timeout || 15000,
        readTimeout: settings.timeout || 15000,
        responseType: isBinary ? 'arraybuffer' : 'text',
    });

    const lowerHeaders: Record<string, unknown> = {};
    Object.entries(response.headers || {}).forEach(([key, value]) => {
        const lower = key.toLowerCase();
        if (lower === 'set-cookie') {
            // 原生层把多条 Set-Cookie 用 ", " 拼成一个字符串；Node axios 给的是数组，
            // request.js 会对其调 .map——这里切回数组，否则直接 TypeError。
            lowerHeaders[lower] = splitSetCookie(String(value));
        } else {
            lowerHeaders[lower] = String(value);
        }
    });

    // 原生层 arraybuffer 实际回 base64 字符串（非 JSON content-type 时）；
    // JSON content-type 会被原生层强制解析成对象/字符串，二进制场景需上游规避。
    let data = response.data;
    if (isBinary && typeof data === 'string') {
        data = Buffer.from(data, 'base64');
    }

    return {
        status: response.status,
        headers: lowerHeaders,
        data,
    };
};

axios.get = (url: string, config?: AxiosSettings) => axios({ ...config, url, method: 'GET' });
axios.post = (url: string, data?: unknown, config?: AxiosSettings) =>
    axios({ ...config, url, method: 'POST', data });

export default axios;
