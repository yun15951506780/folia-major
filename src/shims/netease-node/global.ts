// src/shims/netease-node/global.ts
// 共享的全局转发与运行时引导：Buffer / process 挂到 globalThis，
// 供 CJS 形态的 API 包与各 shim 共用。
import { Buffer } from 'buffer';

const g = globalThis as unknown as {
    Buffer?: typeof Buffer;
    process?: { env: Record<string, string | undefined>; platform: string; version: string; cwd: () => string };
    deviceId?: unknown;
};

if (!g.Buffer) {
    g.Buffer = Buffer;
}

if (!g.process) {
    g.process = { env: {}, platform: 'browser', version: 'v18.0.0', cwd: () => '/' };
}

// API 包用 __dirname 定位 data/ 下的数据文件；shim 的 fs 只按 basename 存取，
// 固定一个虚拟根目录即可让 path.join(__dirname, '../data/x.txt') 落到挂载文件上。
const gAny = g as unknown as Record<string, unknown>;
if (!gAny.__dirname) {
    gAny.__dirname = '/netease-shim/util';
}

// CJS 依赖（buffer、事件层等）引用 Node 的 global 别名。
if (!gAny.global) {
    gAny.global = globalThis;
}
