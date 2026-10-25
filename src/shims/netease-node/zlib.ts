// src/shims/netease-node/zlib.ts
// 只实现 API 包实际用到的同步解压：eapi/xeapi 解密后的 gzip 载荷。
import { ungzip, inflate } from 'pako';
import { Buffer } from 'buffer';

const gunzipSync = (data: Uint8Array): Buffer => Buffer.from(ungzip(data));
const inflateSync = (data: Uint8Array): Buffer => Buffer.from(inflate(data));

export { gunzipSync, inflateSync };
export default { gunzipSync, inflateSync };
