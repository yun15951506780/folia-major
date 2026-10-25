// src/shims/netease-node/fs.ts
// 内存版 fs：API 包用它读写 os.tmpdir 下的 anonymous_token / xeapi_public_key，
// 以及读取 data/china_ip_ranges.txt（随机中国 IP 头，影响地区限制歌曲的可用性）。
// 写入同步映射到 localStorage；数据文件经 Vite ?raw 打进 bundle 后在这里挂载。
import { Buffer } from 'buffer';
import chinaIpRanges from '@neteasecloudmusicapienhanced/api/data/china_ip_ranges.txt?raw';

// global.ts 的引导被 rolldown 惰性化后，util/index.js 顶层的 china_ip IIFE 可能在
// __dirname 引导执行前求值（模块图顺序不保证）。fs.ts 是 util/index.js 的直接依赖，
// 在这里再挂一次，保证同 chunk 内先于消费方执行。
{
    const g = globalThis as unknown as Record<string, unknown>;
    if (!g.__dirname) g.__dirname = '/netease-shim/util';
    if (!g.global) g.global = globalThis;
    if (!g.Buffer) g.Buffer = Buffer;
}

const STORE_KEY = 'folia.netease-shim-fs';

type Store = Record<string, string>;

const loadStore = (): Store => {
    try {
        return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') as Store;
    } catch {
        return {};
    }
};

const persist = (store: Store) => {
    try {
        localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
        // localStorage 满/不可用时退化为进程内内存
    }
};

const store = loadStore();

// 打包期挂载的只读数据文件（key = basename）
const virtualFiles: Store = {
    'china_ip_ranges.txt': chinaIpRanges,
};

const basename = (p: string) => p.split('/').pop() || p;

export const existsSync = (p: string): boolean =>
    Object.prototype.hasOwnProperty.call(virtualFiles, basename(p))
    || Object.prototype.hasOwnProperty.call(store, basename(p));

export const readFileSync = (p: string, encoding?: string): string | Buffer => {
    const name = basename(p);
    const content = store[name] ?? virtualFiles[name];
    if (content === undefined) {
        // 服务器模式由 app.js 预创建空 anonymous_token，request.js 顶层直接读；
        // 这里对缺失文件返回空串以复刻同一语义，避免模块加载即崩。
        return encoding ? '' : Buffer.alloc(0);
    }
    return encoding ? content : Buffer.from(content, 'utf-8');
};

export const writeFileSync = (p: string, data: unknown, encoding?: string): void => {
    void encoding;
    store[basename(p)] = typeof data === 'string' ? data : String(data);
    persist(store);
};

export default { existsSync, readFileSync, writeFileSync };
