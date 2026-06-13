package com.miaomiao.math;

import android.app.Activity;
import android.webkit.JavascriptInterface;

public class AndroidBridge {

    private final Activity activity;

    public AndroidBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void showToast(String message) {
        activity.runOnUiThread(() -> {
            android.widget.Toast.makeText(activity, message, android.widget.Toast.LENGTH_SHORT).show();
        });
    }

    @JavascriptInterface
    public String getUserAgent() {
        return "MiaoMiaoMathAndroid";
    }
}
