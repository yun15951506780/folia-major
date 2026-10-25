// src/services/neteaseEmbedded.ts
// 网易云 API 的应用内嵌运行：把 NeteaseCloudMusicApi 的模块函数直接打进 WebView
// JS bundle，网络层经 axios shim（CapacitorHttp 原生请求，无 CORS），加密链走
// node-crypto shim。等价于桌面 Electron 在主进程内嵌该 API，只是运行环境换成了
// 页面 JS。端点名与模块名的映射规则：/song/url/v1 → song_url_v1。
import '../shims/netease-node/global';

// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import loginQrKey from '@neteasecloudmusicapienhanced/api/module/login_qr_key.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import loginQrCreate from '@neteasecloudmusicapienhanced/api/module/login_qr_create.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import loginQrCheck from '@neteasecloudmusicapienhanced/api/module/login_qr_check.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import loginStatus from '@neteasecloudmusicapienhanced/api/module/login_status.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import logout from '@neteasecloudmusicapienhanced/api/module/logout.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import registerAnonimous from '@neteasecloudmusicapienhanced/api/module/register_anonimous.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import userAccount from '@neteasecloudmusicapienhanced/api/module/user_account.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import userPlaylist from '@neteasecloudmusicapienhanced/api/module/user_playlist.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import userCloud from '@neteasecloudmusicapienhanced/api/module/user_cloud.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import userCloudDetail from '@neteasecloudmusicapienhanced/api/module/user_cloud_detail.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import like from '@neteasecloudmusicapienhanced/api/module/like.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import likelist from '@neteasecloudmusicapienhanced/api/module/likelist.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import lyricNew from '@neteasecloudmusicapienhanced/api/module/lyric_new.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import cloudLyricGet from '@neteasecloudmusicapienhanced/api/module/cloud_lyric_get.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import cloudsearch from '@neteasecloudmusicapienhanced/api/module/cloudsearch.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import personalFm from '@neteasecloudmusicapienhanced/api/module/personal_fm.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import personalFmMode from '@neteasecloudmusicapienhanced/api/module/personal_fm_mode.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import personalized from '@neteasecloudmusicapienhanced/api/module/personalized.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import playlistDetail from '@neteasecloudmusicapienhanced/api/module/playlist_detail.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import playlistDetailDynamic from '@neteasecloudmusicapienhanced/api/module/playlist_detail_dynamic.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import playlistSubscribe from '@neteasecloudmusicapienhanced/api/module/playlist_subscribe.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import playlistTrackAll from '@neteasecloudmusicapienhanced/api/module/playlist_track_all.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import playlistTracks from '@neteasecloudmusicapienhanced/api/module/playlist_tracks.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import recommendSongs from '@neteasecloudmusicapienhanced/api/module/recommend_songs.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import recommendSongsDislike from '@neteasecloudmusicapienhanced/api/module/recommend_songs_dislike.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import historyRecommendSongs from '@neteasecloudmusicapienhanced/api/module/history_recommend_songs.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import historyRecommendSongsDetail from '@neteasecloudmusicapienhanced/api/module/history_recommend_songs_detail.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import fmTrash from '@neteasecloudmusicapienhanced/api/module/fm_trash.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import scrobbleV1 from '@neteasecloudmusicapienhanced/api/module/scrobble_v1.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import songChorus from '@neteasecloudmusicapienhanced/api/module/song_chorus.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import songCopyrightRcmd from '@neteasecloudmusicapienhanced/api/module/song_copyright_rcmd.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import songDetail from '@neteasecloudmusicapienhanced/api/module/song_detail.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import songUrlV1 from '@neteasecloudmusicapienhanced/api/module/song_url_v1.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import album from '@neteasecloudmusicapienhanced/api/module/album.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import albumDetailDynamic from '@neteasecloudmusicapienhanced/api/module/album_detail_dynamic.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import albumSub from '@neteasecloudmusicapienhanced/api/module/album_sub.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import albumSublist from '@neteasecloudmusicapienhanced/api/module/album_sublist.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import artistAlbum from '@neteasecloudmusicapienhanced/api/module/artist_album.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import artistDetail from '@neteasecloudmusicapienhanced/api/module/artist_detail.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import artistSongs from '@neteasecloudmusicapienhanced/api/module/artist_songs.js';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import artistTopSong from '@neteasecloudmusicapienhanced/api/module/artist_top_song.js';

// request 层（util/request.js）：main.js 的注入方式是惰性 require 后透传参数，
// 这里静态导入并同样按 (uri, data, option) 透传。
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import neteaseRequest from '@neteasecloudmusicapienhanced/api/util/request.js';

type NeteaseModuleResult = {
    status: number;
    body: Record<string, unknown> & { cookie?: unknown };
    cookie?: string[];
};

// request 层（util/request.js）：main.js 的注入方式是惰性 require 后透传参数，
// 这里静态导入并同样按 (uri, data, option) 透传。
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import { CookieBridge } from '../shims/netease-node/cookieBridge';
import { writeFileSync } from '../shims/netease-node/fs';
// @ts-ignore 无类型的 CJS 模块，运行时由 Vite 处理互操作
import registerXeapiKey from '@neteasecloudmusicapienhanced/api/module/register_xeapikey.js';

type NeteaseModule = (query: Record<string, unknown>, request?: unknown) => Promise<NeteaseModuleResult>;

const MODULES: Record<string, NeteaseModule> = {
    login_qr_key: loginQrKey as NeteaseModule,
    login_qr_create: loginQrCreate as NeteaseModule,
    login_qr_check: loginQrCheck as NeteaseModule,
    login_status: loginStatus as NeteaseModule,
    logout: logout as NeteaseModule,
    register_anonimous: registerAnonimous as NeteaseModule,
    user_account: userAccount as NeteaseModule,
    user_playlist: userPlaylist as NeteaseModule,
    user_cloud: userCloud as NeteaseModule,
    user_cloud_detail: userCloudDetail as NeteaseModule,
    like: like as NeteaseModule,
    likelist: likelist as NeteaseModule,
    lyric_new: lyricNew as NeteaseModule,
    cloud_lyric_get: cloudLyricGet as NeteaseModule,
    cloudsearch: cloudsearch as NeteaseModule,
    personal_fm: personalFm as NeteaseModule,
    personal_fm_mode: personalFmMode as NeteaseModule,
    personalized: personalized as NeteaseModule,
    playlist_detail: playlistDetail as NeteaseModule,
    playlist_detail_dynamic: playlistDetailDynamic as NeteaseModule,
    playlist_subscribe: playlistSubscribe as NeteaseModule,
    playlist_track_all: playlistTrackAll as NeteaseModule,
    playlist_tracks: playlistTracks as NeteaseModule,
    recommend_songs: recommendSongs as NeteaseModule,
    recommend_songs_dislike: recommendSongsDislike as NeteaseModule,
    history_recommend_songs: historyRecommendSongs as NeteaseModule,
    history_recommend_songs_detail: historyRecommendSongsDetail as NeteaseModule,
    fm_trash: fmTrash as NeteaseModule,
    scrobble_v1: scrobbleV1 as NeteaseModule,
    song_chorus: songChorus as NeteaseModule,
    song_copyright_rcmd: songCopyrightRcmd as NeteaseModule,
    song_detail: songDetail as NeteaseModule,
    song_url_v1: songUrlV1 as NeteaseModule,
    album: album as NeteaseModule,
    album_detail_dynamic: albumDetailDynamic as NeteaseModule,
    album_sub: albumSub as NeteaseModule,
    album_sublist: albumSublist as NeteaseModule,
    artist_album: artistAlbum as NeteaseModule,
    artist_detail: artistDetail as NeteaseModule,
    artist_songs: artistSongs as NeteaseModule,
    artist_top_song: artistTopSong as NeteaseModule,
};

// 模块层返回的 cookie 是 Set-Cookie 数组；HTTP 部署形态下它以字符串进响应体，
// 这里拼成同一种形态，netease.ts 的上层逻辑不需要感知差异。
const cookieArrayToString = (cookie: NeteaseModuleResult['cookie']): string => {
    if (typeof cookie === 'string') return cookie;
    if (Array.isArray(cookie)) return cookie.join('; ');
    return '';
};

export const neteaseEndpointToModuleName = (endpoint: string): string => {
    const path = endpoint.split('?')[0];
    return path.replace(/^\//, '').replace(/\//g, '_');
};

export const hasNeteaseModule = (endpoint: string): boolean => {
    const name = neteaseEndpointToModuleName(endpoint);
    return Boolean(MODULES[name]);
};

// 与包内 util.cookieToJson 一致的最小实现：避免引入会拉进 fs 依赖的 util 入口。
const cookieToJson = (cookie: string): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const pair of cookie.split(';')) {
        const idx = pair.indexOf('=');
        if (idx <= 0) continue;
        const key = pair.slice(0, idx).trim();
        if (!key) continue;
        try {
            result[key] = decodeURIComponent(pair.slice(idx + 1).trim());
        } catch {
            result[key] = pair.slice(idx + 1).trim();
        }
    }
    return result;
};

// xeapi 端点（歌曲 URL、匿名注册等）需要公钥：服务端部署由 generateConfig 在启动时
// 获取并写入 tmp 文件，request.js 每次请求时读取。嵌入运行在这里做同样的事——
// register_xeapikey 走的是普通 /api 请求（不依赖 xeapi 本身），无鸡生蛋问题。
let xeapiBootstrap: Promise<void> | null = null;

const ensureXeapiKey = (): Promise<void> => {
    if (!xeapiBootstrap) {
        xeapiBootstrap = (async () => {
            try {
                const deviceId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                    .map(b => b.toString(16).padStart(2, '0')).join('');
                (globalThis as unknown as { deviceId?: string }).deviceId = deviceId;
                const res = await (registerXeapiKey as NeteaseModule)({ deviceId });
                if (res?.body) {
                    writeFileSync('/tmp/xeapi_public_key', JSON.stringify(res.body));
                }
            } catch (error) {
                console.warn('[netease-embedded] xeapi key bootstrap failed:', error);
            }
        })();
    }
    return xeapiBootstrap;
};

// endpoint 形如 /song/url/v1?ids=xxx&level=exhigh；返回体对齐 HTTP 部署的 JSON 响应
// （body 内容 + cookie 字符串字段），netease.ts 的调用方无需改动。
export const callNeteaseModule = async (
    endpoint: string,
    cookieString?: string,
): Promise<Record<string, unknown>> => {
    const name = neteaseEndpointToModuleName(endpoint);
    const fn = MODULES[name];
    if (!fn) {
        throw new Error(`netease embedded: no module for endpoint ${endpoint}`);
    }

    const query: Record<string, unknown> = Object.fromEntries(
        new URLSearchParams(endpoint.split('?')[1] ?? ''),
    );
    if (cookieString) {
        query.cookie = cookieToJson(cookieString);
    }
    // 显式 e_r=false：eapi 响应默认是明文 JSON（encryptResponse=false），
    // 二进制密文会被原生 HTTP 层的 application/json 强制解析破坏（UTF-8 有损）。
    // 协议本身不干预——登录 cookie（MUSIC_U）由 eapi 的 Set-Cookie 正常下发。
    query.e_r = false;
    await ensureXeapiKey();
    const result = await fn(query, neteaseRequest);

    // 原生 CookieHandler 会把响应 Set-Cookie 消费进 WebView 持久化 cookie 库，
    // 响应头里不再可见。登录/账号链路需要 cookie 字符串（MUSIC_U 等），
    // 这里从 cookie 库补回；同时该库会自动 attach 到后续请求，双保险。
    const cookieArr = Array.isArray(result?.cookie) ? result.cookie : [];
    if (cookieArr.length === 0 && /^\/(login|user|register)/.test(endpoint)) {
        try {
            const jar = await CookieBridge.getCookie({ url: 'https://music.163.com' });
            if (jar?.cookie) {
                result.cookie = jar.cookie.split('; ');
            }
        } catch {
            // 插件不可用时维持原状
        }
    }

    const body = { ...(result?.body ?? {}) };
    const cookie = cookieArrayToString(result?.cookie);
    if (cookie && typeof body.cookie === 'undefined') {
        body.cookie = cookie;
    }
    return body;
};
