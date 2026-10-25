// src/shims/netease-node/path.ts
// POSIX 风格的极简 path：API 包只用 resolve/join/dirname/basename 处理 tmpdir 路径。
export const resolve = (...parts: string[]): string => {
    let resolved = '';
    for (const part of parts) {
        if (!part) continue;
        if (part.startsWith('/')) {
            resolved = part;
        } else {
            resolved = `${resolved}/${part}`.replace(/\/{2,}/g, '/');
        }
    }
    return resolved || '/';
};

export const join = (...parts: string[]): string =>
    parts.filter(Boolean).join('/').replace(/\/{2,}/g, '/');

export const dirname = (p: string): string => {
    const idx = p.lastIndexOf('/');
    return idx <= 0 ? '/' : p.slice(0, idx);
};

export const basename = (p: string): string => p.split('/').pop() || '';

export default { resolve, join, dirname, basename };
