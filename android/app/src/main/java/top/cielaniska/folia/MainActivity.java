package top.cielaniska.folia;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CookieBridgePlugin.class);
        registerPlugin(BackGesturePlugin.class);
        super.onCreate(savedInstanceState);
        // 全屏沉浸：内容延伸到系统栏下面（Android 15 强制 edge-to-edge，这里让所有版本行为一致），
        // 配合 Web 端 viewport-fit=cover 与 --safe-area-* 变量。
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // 渲染进刘海区域：默认模式在竖屏下会给刘海留一条空边，SHORT_EDGES 让内容铺满整块屏。
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = getWindow().getAttributes();
            attributes.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(attributes);
        }

        // 任何时刻系统栏都不该出现： insets 一到就立刻再藏一层，
        // 覆盖键盘、对话框等场景的系统栏自动弹出。
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
                .setSystemBarsBehavior(
                        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        getWindow().getDecorView().setOnApplyWindowInsetsListener((view, insets) -> {
            if (insets.isVisible(WindowInsetsCompat.Type.systemBars())) {
                hideSystemBars();
            }
            return view.onApplyWindowInsets(insets);
        });
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemBars();
        }
    }

    // sticky 沉浸：状态栏与导航栏整条隐藏；配合上面的 insets 监听，浮层也不会停留。
    private void hideSystemBars() {
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }
}
