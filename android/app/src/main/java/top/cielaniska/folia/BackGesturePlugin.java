package top.cielaniska.folia;

import android.app.Activity;
import android.webkit.WebView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 安卓返回手势协调。
 *
 * 系统返回手势默认直接 finish 掉 Activity——WebView 里的 history 栈根本没机会参与。
 * JS 侧（useAndroidBackGesture）把"按返回该做什么"挂到 window.__foliaNativeBack
 * （关浮层或 history.back），并把"还能不能后退"报告给 setHistoryCanGoBack：
 *  - 回调启用时手势交给 window.__foliaNativeBack()；
 *  - 回调禁用（已退到根视图）时手势走系统默认行为，真正退出应用。
 */
@CapacitorPlugin(name = "BackGesture")
public class BackGesturePlugin extends Plugin {

    private final androidx.activity.OnBackPressedCallback backCallback =
        new androidx.activity.OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null) {
                    webView.evaluateJavascript(
                        "window.__foliaNativeBack ? window.__foliaNativeBack() : window.history.back()", null);
                }
            }
        };

    @Override
    public void load() {
        Activity activity = getActivity();
        if (activity instanceof androidx.activity.ComponentActivity) {
            ((androidx.activity.ComponentActivity) activity)
                .getOnBackPressedDispatcher().addCallback(backCallback);
        }
        super.load();
    }

    @PluginMethod
    public void setHistoryCanGoBack(PluginCall call) {
        Boolean canGoBack = call.getBoolean("canGoBack");
        if (canGoBack == null) {
            call.reject("canGoBack is required");
            return;
        }
        backCallback.setEnabled(canGoBack);
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        backCallback.remove();
        super.handleOnDestroy();
    }
}
