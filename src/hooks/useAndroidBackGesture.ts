// src/hooks/useAndroidBackGesture.ts
// 安卓壳内把系统返回手势接进应用内导航。
//
// 原生层（BackGesturePlugin）把手势转成 history.back()，由 useAppNavigation 既有的
// popstate 管线接管；但那个栈只覆盖视图层（lattice/home/player、搜索、合集），
// 不含弹窗和播放面板。这里在 webview 历史之外再补一层"应用内可返回"判定：
//  - 有弹窗/面板/搜索浮层开着 → 原生回调吃掉手势，改成关掉最上层的浮层；
//  - 否则交给 history.back() 逐层退视图，退到根时禁用回调，手势才真正退出应用。
// 判定全部走 DOM 查询 + 视图 store，不侵入任何现有组件。
import { useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';
import { isAndroidApp } from '../utils/platform';
import { useAppViewStore } from '../stores/useAppViewStore';
import { useCollectionNavigationStore } from '../stores/useCollectionNavigationStore';
import { useSearchNavigationStore } from '../stores/useSearchNavigationStore';

export interface BackGesturePluginInterface {
    setHistoryCanGoBack(options: { canGoBack: boolean }): Promise<void>;
    requestBack(): Promise<void>;
}

const BackGesture = registerPlugin<BackGesturePluginInterface>('BackGesture');

// 最上层的浮层按 DOM 顺序判定：z 越高的越先关。命令面板与设置弹窗最顶，其次普通弹窗，
// 播放面板最后。
const OVERLAY_SELECTOR = [
    '[data-folia-keyboard-window="true"]',
    '[role="dialog"]',
    '[data-radix-popper-content-wrapper]',
].join(', ');

const hasOpenOverlay = (): boolean => Boolean(document.querySelector(OVERLAY_SELECTOR));

// 逐层关浮层：命令面板/设置窗有各自的 Esc 监听，模拟一次 Esc 走它们的既有逻辑；
// 其余 role=dialog 用 framer-motion 进出场，直接派发 Esc 最稳妥（KeyboardEvent
// 冒泡到 document，被各弹窗自己的 keydown 捕获）。
const closeTopOverlay = (): void => {
    const overlays = Array.from(document.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR));
    if (!overlays.length) return;
    const top = overlays[overlays.length - 1];
    top.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', code: 'Escape', bubbles: true, cancelable: true,
    }));
};

export const useAndroidBackGesture = (enabled: boolean) => {
    useEffect(() => {
        if (!enabled || !isAndroidApp) return;

        let disposed = false;

        const report = (canGoBack: boolean) => {
            if (!disposed) {
                void BackGesture.setHistoryCanGoBack({ canGoBack }).catch(() => undefined);
            }
        };

        // 只向原生层报告"现在按返回应该发生什么"，绝不主动动作：
        // 弹窗刚挂到 DOM 时这里会被 MutationObserver 触发，若在此派发 Esc 会把
        // 刚打开的弹窗当场关掉（表现即"无法唤出设置"）。关浮层由原生回调按下时
        // 通过 onNativeBack → closeTopOverlay 完成。
        const evaluate = () => {
            const { view: currentView, isPanelOpen } = useAppViewStore.getState();
            const collectionDepth = useCollectionNavigationStore.getState().snapshot?.stack.length ?? 0;
            const searchOpen = useSearchNavigationStore.getState().isSearchOpen;
            const overlayOpen = hasOpenOverlay() || isPanelOpen || searchOpen;

            if (overlayOpen) {
                report(true);
                return;
            }

            const viewHasBack = currentView !== 'lattice' || collectionDepth > 0;
            report(viewHasBack);
        };

        // 原生回调按下返回时的唯一动作入口。
        (window as unknown as { __foliaNativeBack?: () => void }).__foliaNativeBack = () => {
            const { isPanelOpen } = useAppViewStore.getState();
            const searchOpen = useSearchNavigationStore.getState().isSearchOpen;
            if (hasOpenOverlay() || isPanelOpen || searchOpen) {
                // 浮层不在 history 栈里：用 Esc 等价路径关最上层，不碰 history。
                closeTopOverlay();
                return;
            }
            window.history.back();
        };

        // 视图/面板/合集栈变化都会改变"还能不能退"
        const unsubscribe = useAppViewStore.subscribe(evaluate);
        const unsubscribeCollection = useCollectionNavigationStore.subscribe(evaluate);
        const unsubscribeSearch = useSearchNavigationStore.subscribe(evaluate);
        // DOM 弹窗是命令式的（framer-motion 进出场），用突变监听兜住
        const observer = new MutationObserver(evaluate);
        observer.observe(document.body, { childList: true, subtree: true });

        evaluate();

        return () => {
            disposed = true;
            unsubscribe();
            unsubscribeCollection();
            unsubscribeSearch();
            observer.disconnect();
            // 卸载时归还手势给系统（正常退出路径）
            report(false);
            delete (window as unknown as { __foliaNativeBack?: () => void }).__foliaNativeBack;
        };
    }, [enabled]);
};
