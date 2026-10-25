// src/shims/netease-node/crypto.ts
// Node crypto 的浏览器 shim：只为 @neteasecloudmusicapienhanced/api 在 WebView 内
// 直接运行而实现。http://localhost 属于 Chromium 可信上下文，但 SubtleCrypto 是异步的，
// 而 API 包的加密链是同步的，所以这里全用同步纯 JS 实现：
// ECB / MD5 / SHA256 / HMAC 走 crypto-js，AES-128-GCM 走 @noble/ciphers，X25519 走 @noble/curves。
import CryptoJS from 'crypto-js';
import { gcm } from '@noble/ciphers/aes.js';
import { x25519 } from '@noble/curves/ed25519.js';
import { Buffer } from 'buffer';

type BufferLike = typeof Buffer;

const toWordArray = (data: Uint8Array) => CryptoJS.lib.WordArray.create(data as unknown as number[]);

const coerceBytes = (data: unknown): Uint8Array => {
    if (data instanceof Uint8Array) return data;
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) return new Uint8Array(data);
    if (typeof data === 'string') return new TextEncoder().encode(data);
    return new Uint8Array(data as unknown as ArrayBuffer);
};

const waToBuf = (wa: { toString(enc: typeof CryptoJS.enc.Hex): string }): Buffer =>
    Buffer.from(wa.toString(CryptoJS.enc.Hex), 'hex');

const randomBytes = (size: number): Buffer => {
    const out = new Uint8Array(size);
    crypto.getRandomValues(out);
    return Buffer.from(out);
};

type HashAlg = 'md5' | 'sha256';

const createHash = (alg: HashAlg) => {
    let data = Buffer.alloc(0);
    const hasher = {
        update(chunk: unknown, _enc?: BufferEncoding) {
            data = Buffer.concat([data, Buffer.from(coerceBytes(chunk))]);
            return hasher;
        },
        digest(enc?: 'hex' | 'base64'): Buffer | string {
            const wa = alg === 'md5' ? CryptoJS.MD5(toWordArray(data)) : CryptoJS.SHA256(toWordArray(data));
            const hex = wa.toString(CryptoJS.enc.Hex);
            const raw = Buffer.from(hex, 'hex');
            return enc === 'hex' ? hex : enc === 'base64' ? raw.toString('base64') : raw;
        },
    };
    return hasher;
};

const createHmac = (alg: 'sha256', key: unknown) => {
    if (alg !== 'sha256') throw new Error(`netease-crypto shim: unsupported hmac ${alg}`);
    const keyBytes = coerceBytes(key);
    let data = Buffer.alloc(0);
    const hasher = {
        update(chunk: unknown) {
            data = Buffer.concat([data, Buffer.from(coerceBytes(chunk))]);
            return hasher;
        },
        digest(enc?: 'hex' | 'base64'): Buffer | string {
            const wa = CryptoJS.HmacSHA256(toWordArray(data), toWordArray(keyBytes));
            const raw = Buffer.from(wa.toString(CryptoJS.enc.Hex), 'hex');
            return enc === 'hex' ? raw.toString('hex') : enc === 'base64' ? raw.toString('base64') : raw;
        },
    };
    return hasher;
};

// ECB：PKCS7 填充 + 去填充语义与 Node 默认（setAutoPadding(true)）一致
const isEcb = (alg: string) => /-ecb$/i.test(alg);

const createCipheriv = (alg: string, key: unknown, iv: unknown) => {
    const keyBytes = Buffer.from(coerceBytes(key));
    const normalized = alg.toLowerCase();

    if (isEcb(normalized)) {
        const keyWa = CryptoJS.enc.Hex.parse(keyBytes.toString('hex'));
        let plaintext = Buffer.alloc(0);
        return {
            update(chunk: unknown) {
                plaintext = Buffer.concat([plaintext, Buffer.from(coerceBytes(chunk))]);
                return Buffer.alloc(0);
            },
            final(): Buffer {
                const encrypted = CryptoJS.AES.encrypt(toWordArray(plaintext), keyWa, {
                    mode: CryptoJS.mode.ECB,
                    padding: CryptoJS.pad.Pkcs7,
                });
                return waToBuf(encrypted.ciphertext as unknown as { toString(enc: typeof CryptoJS.enc.Hex): string });
            },
            getAuthTag: () => Buffer.alloc(0),
            setAutoPadding: () => undefined,
        };
    }

    if (normalized === 'aes-128-gcm') {
        const ivBytes = coerceBytes(iv);
        let plaintext = Buffer.alloc(0);
        let sealed: Uint8Array | null = null;
        return {
            update(chunk: unknown) {
                plaintext = Buffer.concat([plaintext, Buffer.from(coerceBytes(chunk))]);
                return Buffer.alloc(0);
            },
            final(): Buffer {
                // @noble/ciphers 的输出是 ciphertext||tag，与 Node 的 update/final + getAuthTag 对应
                sealed = gcm(keyBytes, ivBytes).encrypt(new Uint8Array(plaintext));
                return Buffer.from(sealed.subarray(0, sealed.length - 16));
            },
            getAuthTag: () => {
                const tag = sealed ?? new Uint8Array(16);
                return Buffer.from(tag.subarray(-16));
            },
            setAutoPadding: () => undefined,
        };
    }

    throw new Error(`netease-crypto shim: unsupported cipher ${alg}`);
};

const createDecipheriv = (alg: string, key: unknown, iv: unknown) => {
    const keyBytes = Buffer.from(coerceBytes(key));
    const normalized = alg.toLowerCase();

    if (isEcb(normalized)) {
        const keyWa = CryptoJS.enc.Hex.parse(keyBytes.toString('hex'));
        let ciphertext = Buffer.alloc(0);
        return {
            update(chunk: unknown) {
                ciphertext = Buffer.concat([ciphertext, Buffer.from(coerceBytes(chunk))]);
                return Buffer.alloc(0);
            },
            final(): Buffer {
                const decrypted = CryptoJS.AES.decrypt(
                    { ciphertext: CryptoJS.enc.Hex.parse(ciphertext.toString('hex')) } as unknown as CryptoJS.lib.CipherParams,
                    keyWa,
                    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 },
                );
                return waToBuf(decrypted as unknown as { toString(enc: typeof CryptoJS.enc.Hex): string });
            },
            setAutoPadding: () => undefined,
        };
    }

    void iv;
    throw new Error(`netease-crypto shim: unsupported decipher ${alg}`);
};

// x25519：包装成 Node 风格 key 对象；export() 返回完整 DER SPKI（44 字节），
// 包内用 .subarray(-32) 取裸密钥，前缀长度必须与 Node 一致。
const X25519_SPKI_PREFIX = Buffer.from('302a300506032b656e032100', 'hex');

const createPublicKey = (opts: { key: unknown }) => ({
    // 入参可能是完整 DER SPKI（44 字节，Node 侧由包内构造）；X25519 运算只认裸 32 字节
    raw: Buffer.from(coerceBytes(opts.key)).subarray(-32),
});

const generateKeyPairSync = (_type: 'x25519') => {
    const priv = x25519.utils.randomSecretKey();
    const pub = x25519.getPublicKey(priv);
    return {
        publicKey: {
            raw: Buffer.from(pub),
            export: () => Buffer.concat([X25519_SPKI_PREFIX, Buffer.from(pub)]),
        },
        privateKey: {
            raw: Buffer.from(priv),
            export: () => Buffer.concat([X25519_SPKI_PREFIX, Buffer.from(priv)]),
        },
    };
};

const diffieHellman = ({ privateKey, publicKey }: { privateKey: { raw: Uint8Array }; publicKey: { raw: Uint8Array } }) =>
    Buffer.from(x25519.getSharedSecret(new Uint8Array(privateKey.raw), new Uint8Array(publicKey.raw)));

const nodeCrypto = {
    createHash,
    createHmac,
    createCipheriv,
    createDecipheriv,
    randomBytes,
    generateKeyPairSync,
    diffieHellman,
    createPublicKey,
    constants: {},
};

export default nodeCrypto;
export {
    createHash,
    createHmac,
    createCipheriv,
    createDecipheriv,
    randomBytes,
    generateKeyPairSync,
    diffieHellman,
    createPublicKey,
};
