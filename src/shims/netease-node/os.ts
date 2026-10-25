// src/shims/netease-node/os.ts
// tmpdir 返回固定路径即可：fs shim 只按 basename 存取。
export const tmpdir = () => '/tmp';

export default { tmpdir };
