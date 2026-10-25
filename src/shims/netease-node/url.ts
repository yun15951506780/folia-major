// src/shims/netease-node/url.ts
// 浏览器全局已有等价实现，直接转发（global.ts 同时负责 Buffer/process 引导）。
const URLC = globalThis.URL;
const URLSearchParamsC = globalThis.URLSearchParams;

export { URLC as URL, URLSearchParamsC as URLSearchParams };
export default { URL: URLC, URLSearchParams: URLSearchParamsC };
