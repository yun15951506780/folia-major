package top.cielaniska.folia;

import android.webkit.CookieManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 暴露 WebView 持久化 cookie 库的只读访问。
 *
 * 嵌入式网易云 API 依赖响应 Set-Cookie 传递登录态（MUSIC_U 等），但 Capacitor 的
 * CapacitorCookieManager 作为全局 CookieHandler 会在 HttpURLConnection 层把
 * Set-Cookie 消费进 webkit cookie 库，JS 侧（document.cookie 只能读 localhost 源）
 * 无法拿到原始值。这里按域名读库，补齐嵌入链路的 cookie 传递。
 */
@CapacitorPlugin(name = "CookieBridge")
public class CookieBridgePlugin extends Plugin {

    @PluginMethod
    public void getCookie(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }
        CookieManager cookieManager = CookieManager.getInstance();
        String cookie = cookieManager.getCookie(url);
        JSObject result = new JSObject();
        result.put("cookie", cookie == null ? "" : cookie);
        call.resolve(result);
    }
}
