// src/shims/netease-node/stubs.ts
// 供多个 Node 内建/代理库别名共用的空实现。
// http/https：request.js 仅在配置代理时才真正使用网络层，正常路径走 axios shim。
// pac-proxy-agent / tunnel：同上，仅在 options.proxy 配置时实例化。
// jsdom：只被反作弊 token（register_checktoken_v2，Watchman SDK）使用；
//        构造时抛错，受影响的功能仅 playlist_subscribe（收藏歌单）。

class UnsupportedInBrowser extends Error {
    constructor(name: string) {
        super(`${name} is not available in the netease WebView shim`);
        this.name = 'UnsupportedInBrowser';
    }
}

export class PacProxyAgent {
    constructor() {
        throw new UnsupportedInBrowser('pac-proxy-agent');
    }
}

export const httpsOverHttp = () => {
    throw new UnsupportedInBrowser('tunnel');
};

export const httpOverHttp = httpsOverHttp;

export class JSDOM {
    constructor() {
        throw new UnsupportedInBrowser('jsdom');
    }
}

export class VirtualConsole {}

export class Server {}
export class Socket {}
export class Agent {}
export const createServer = () => {
    throw new UnsupportedInBrowser('http.createServer');
};
export const request = () => {
    throw new UnsupportedInBrowser('http.request');
};
export const get = () => {
    throw new UnsupportedInBrowser('http.get');
};

// @neteasecloudmusicapienhanced/unblockmusic-utils：灰歌解锁工具（Node 专用，
// 依赖 util.inherits / process.cwd / 文件系统）。仅 query.unblock === 'true' 时才会
// 被调用，安卓嵌入模式不支持该功能；其余请求路径不受影响。
export const matchID = () => {
    throw new UnsupportedInBrowser('unblockmusic-utils');
};

// dotenv：仅在 Node 侧读取 .env，浏览器/WebView 环境无操作。
export const config = () => ({ parsed: {} });
