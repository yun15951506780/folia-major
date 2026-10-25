import { useEffect } from 'react';
import type { RefObject } from 'react';
import { MediaSession } from '@capgo/capacitor-media-session';
import { PlayerState } from '../types';
import type { SongResult } from '../types';
import { getSongAlbumLabel, getSongArtistLabel, getSongCoverUrl } from '../services/onlineMusic/songMetadata';
import {
    createMediaSessionPositionState,
    getSupportedMediaSessionArtworkUrl,
    isMediaSessionSourceReady,
} from '../utils/mediaSessionSync';
import { isNativeApp } from '../utils/platform';

// 安卓 http scheme 下 navigator.mediaSession 不保证存在（非安全上下文），
// 但原生插件不依赖它；浏览器端则仍要求 API 可用。
const canUseMediaSession = () => isNativeApp || 'mediaSession' in navigator;

// Bridges Folia playback state to the platform media session.
// 统一走 @capgo/capacitor-media-session：浏览器的 Web 实现是对 navigator.mediaSession 的
// 透明包装（行为与原实现一致），安卓原生壳里则落到 MediaSessionService ——
// 提供系统媒体通知、锁屏控制，并以前台服务保活后台播放。
type UseMediaSessionBridgeOptions = {
    audioRef: RefObject<HTMLAudioElement | null>;
    /**
     * The deck the displayed track is playing on, or null when the picture is live.
     *
     * Metadata, clock and source have to describe the same deck. `currentSong` is already the
     * DISPLAYED track - the outgoing one for the length of a blend - while `audioRef` names the
     * active deck, which by then is the arriving track. Publishing the two together put the outgoing
     * track's title on the incoming track's duration and position, so the system panel showed one
     * song's name over another song's progress. `audioSrc` is passed to match this element.
     */
    getDisplayAudioElement?: () => HTMLAudioElement | null;
    audioSrc: string | null;
    currentSong: SongResult | null;
    cachedCoverUrl: string | null;
    playerState: PlayerState;
    isNowPlayingStageActive: boolean;
    unknownArtistLabel: string;
    mediaSessionPlayRef: RefObject<() => Promise<void>>;
    mediaSessionPauseRef: RefObject<() => void>;
    mediaSessionPrevRef: RefObject<() => void>;
    mediaSessionNextRef: RefObject<() => Promise<void> | void>;
    isNowPlayingControlDisabledRef: RefObject<boolean>;
};

export const useMediaSessionBridge = ({
    audioRef,
    getDisplayAudioElement,
    audioSrc,
    currentSong,
    cachedCoverUrl,
    playerState,
    isNowPlayingStageActive,
    unknownArtistLabel,
    mediaSessionPlayRef,
    mediaSessionPauseRef,
    mediaSessionPrevRef,
    mediaSessionNextRef,
    isNowPlayingControlDisabledRef,
}: UseMediaSessionBridgeOptions) => {
    useEffect(() => {
        if (!canUseMediaSession()) {
            return;
        }

        const setActionHandlerSafely = (
            action: 'play' | 'pause' | 'previoustrack' | 'nexttrack',
            handler: (() => void | Promise<void>) | null
        ) => {
            void MediaSession.setActionHandler({ action }, handler as never).catch((e: unknown) => {
                console.warn(`[MediaSession] Failed to bind ${action} handler`, e);
            });
        };

        setActionHandlerSafely('play', async () => {
            if (isNowPlayingControlDisabledRef.current || !audioRef.current) {
                return;
            }

            try {
                await mediaSessionPlayRef.current();
            } catch (e) {
                console.error('MediaSession play failed', e);
            }
        });
        setActionHandlerSafely('pause', () => {
            if (isNowPlayingControlDisabledRef.current || !audioRef.current) {
                return;
            }

            mediaSessionPauseRef.current();
        });
        setActionHandlerSafely('previoustrack', () => {
            if (isNowPlayingControlDisabledRef.current) {
                return;
            }
            mediaSessionPrevRef.current();
        });
        setActionHandlerSafely('nexttrack', () => {
            if (isNowPlayingControlDisabledRef.current) {
                return;
            }
            void mediaSessionNextRef.current();
        });

        return () => {
            setActionHandlerSafely('play', null);
            setActionHandlerSafely('pause', null);
            setActionHandlerSafely('previoustrack', null);
            setActionHandlerSafely('nexttrack', null);
        };
    }, [audioRef, isNowPlayingControlDisabledRef, mediaSessionNextRef, mediaSessionPauseRef, mediaSessionPlayRef, mediaSessionPrevRef]);

    useEffect(() => {
        if (!canUseMediaSession()) {
            return;
        }

        if (!currentSong) {
            void MediaSession.setPlaybackState({ playbackState: 'none' }).catch((e: unknown) => {
                console.warn('[MediaSession] Failed to clear playback state', e);
            });
            return;
        }

        // The displayed track's own deck, so the position published below belongs to the title
        // published beside it. Falls back to the active deck whenever no blend is holding a picture.
        const audio = getDisplayAudioElement?.() ?? audioRef.current;
        if (!audio || !audioSrc) {
            return;
        }

        let disposed = false;
        const sourceArtworkUrl = cachedCoverUrl || getSongCoverUrl(currentSong) || '';
        let artworkUrl = getSupportedMediaSessionArtworkUrl(sourceArtworkUrl, document.baseURI);
        let disposableArtworkUrl: string | null = null;
        // 位置状态必须先于 metadata 发布（Chromium 在无效位置下会清掉平台会话），
        // 然后一次性提交 title/artist/album/artwork。
        const publish = async () => {
            if (disposed || !isMediaSessionSourceReady(audio, audioSrc, document.baseURI)) {
                return;
            }

            const positionState = createMediaSessionPositionState(audio);
            if (!positionState) {
                return;
            }

            try {
                await MediaSession.setPositionState({
                    duration: positionState.duration,
                    playbackRate: positionState.playbackRate,
                    position: positionState.position,
                });
                if (disposed) return;
                await MediaSession.setMetadata({
                    title: currentSong.name,
                    artist: getSongArtistLabel(currentSong) || unknownArtistLabel,
                    album: getSongAlbumLabel(currentSong),
                    artwork: artworkUrl ? [{ src: artworkUrl }] : [],
                });
            } catch (e) {
                console.warn('[MediaSession] Failed to update metadata', e);
            }
        };

        // MediaMetadata rejects Electron's custom protocol, so expose that image through a
        // short-lived blob URL while this track owns the platform media session.
        const prepareUnsupportedArtwork = async () => {
            if (!sourceArtworkUrl || artworkUrl) return;

            try {
                const response = await fetch(sourceArtworkUrl);
                if (!response.ok) throw new Error(`Artwork request failed: ${response.status}`);
                const artworkBlob = await response.blob();
                if (artworkBlob.size <= 0 || !artworkBlob.type.startsWith('image/')) {
                    throw new Error('Artwork response is not a valid image');
                }

                const objectUrl = URL.createObjectURL(artworkBlob);
                if (disposed) {
                    URL.revokeObjectURL(objectUrl);
                    return;
                }
                disposableArtworkUrl = objectUrl;
                artworkUrl = objectUrl;
                void publish();
            } catch (e) {
                if (!disposed) console.warn('[MediaSession] Failed to prepare artwork', e);
            }
        };

        audio.addEventListener('loadedmetadata', publish);
        audio.addEventListener('durationchange', publish);
        // Re-publish after playback starts in case Chromium delivered a late clear from the old source.
        audio.addEventListener('playing', publish);
        void publish();
        void prepareUnsupportedArtwork();

        return () => {
            disposed = true;
            audio.removeEventListener('loadedmetadata', publish);
            audio.removeEventListener('durationchange', publish);
            audio.removeEventListener('playing', publish);
            if (disposableArtworkUrl) URL.revokeObjectURL(disposableArtworkUrl);
        };
    }, [audioRef, audioSrc, cachedCoverUrl, currentSong, getDisplayAudioElement, unknownArtistLabel]);

    useEffect(() => {
        if (!canUseMediaSession()) {
            return;
        }

        const playbackState = isNowPlayingStageActive
            ? 'none'
            : currentSong
                ? (playerState === PlayerState.PLAYING ? 'playing' : 'paused')
                : 'none';
        void MediaSession.setPlaybackState({ playbackState }).catch((e: unknown) => {
            console.warn('[MediaSession] Failed to update playback state', e);
        });
    }, [currentSong, isNowPlayingStageActive, playerState]);
};
