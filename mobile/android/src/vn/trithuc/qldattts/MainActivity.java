package vn.trithuc.qldattts;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.text.InputType;
import android.util.Base64;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Ứng dụng Android bọc phần mềm QLDA TTTS (bản web chạy trên máy chủ của Ban).
 * Lần đầu mở: nhập địa chỉ máy chủ, kiểm tra /api/health rồi lưu lại.
 * Nhấn Quay lại ở màn hình đầu: hộp chọn Tải lại / Đổi máy chủ / Thoát.
 */
public class MainActivity extends Activity {
    private static final String PREFS = "qlda";
    private static final String KEY_SERVER = "server";
    private static final String START_PATH = "/#hien-truong";
    private static final int REQ_FILE = 11;
    private static final int COLOR_DARK = 0xFF0D2A57;
    private static final int COLOR_ACCENT = 0xFF1F5FBF;

    /** Chặn thẻ <a download href="blob:..."> (xuất Excel, sao lưu) và chuyển nội dung sang ứng dụng để lưu. */
    private static final String BLOB_HOOK =
        "(function(){if(window.__qldaHook)return;window.__qldaHook=1;" +
        "document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href^=\"blob:\"]'):null;if(!a)return;" +
        "e.preventDefault();e.stopPropagation();var n=a.getAttribute('download')||'tep-tai-ve';" +
        "fetch(a.href).then(function(r){return r.blob();}).then(function(b){var f=new FileReader();" +
        "f.onloadend=function(){var s=String(f.result);QLDA.saveBase64(n,b.type||'application/octet-stream',s.substring(s.indexOf(',')+1));};" +
        "f.readAsDataURL(b);}).catch(function(err){QLDA.toast('Không lưu được tệp: '+err);});},true);})();";

    private SharedPreferences prefs;
    private FrameLayout root;
    private WebView web;
    private ProgressBar progress;
    private View errorView;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraUri;
    private String server;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);
        setContentView(root);
        server = prefs.getString(KEY_SERVER, null);
        if (server == null) showSetup(null);
        else showWeb(state);
    }

    // ---------- Màn hình nhập địa chỉ máy chủ ----------

    private void showSetup(String message) {
        if (web != null) { root.removeView(web); web.destroy(); web = null; }
        root.removeAllViews();
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(24), dp(48), dp(24), dp(24));

        TextView title = new TextView(this);
        title.setText("QLDA Trung tâm Thủy sản TP. HCM");
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(COLOR_DARK);
        box.addView(title);

        TextView sub = new TextView(this);
        sub.setText("Nhập địa chỉ máy chủ phần mềm do quản trị hệ thống cung cấp, ví dụ https://qlda.example.vn hoặc http://192.168.1.10:5080");
        sub.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        sub.setTextColor(0xFF444444);
        sub.setPadding(0, dp(12), 0, dp(20));
        box.addView(sub);

        final EditText input = new EditText(this);
        input.setHint("Địa chỉ máy chủ");
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setImeOptions(EditorInfo.IME_ACTION_GO);
        input.setText(prefs.getString(KEY_SERVER, ""));
        box.addView(input, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        final TextView status = new TextView(this);
        status.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        status.setPadding(0, dp(12), 0, dp(12));
        if (message != null) { status.setText(message); status.setTextColor(0xFFB3261E); }
        box.addView(status);

        final Button ok = new Button(this);
        ok.setText("Kết nối");
        ok.setTextColor(Color.WHITE);
        ok.setBackgroundColor(COLOR_ACCENT);
        box.addView(ok, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52)));

        final Runnable go = new Runnable() {
            @Override public void run() {
                final String url = normalize(input.getText().toString());
                if (url == null) { status.setTextColor(0xFFB3261E); status.setText("Địa chỉ không hợp lệ."); return; }
                ok.setEnabled(false);
                status.setTextColor(0xFF444444);
                status.setText("Đang kiểm tra kết nối tới " + url + " …");
                new Thread(new Runnable() {
                    @Override public void run() {
                        final String err = checkHealth(url);
                        runOnUiThread(new Runnable() {
                            @Override public void run() {
                                ok.setEnabled(true);
                                if (err != null) { status.setTextColor(0xFFB3261E); status.setText(err); return; }
                                prefs.edit().putString(KEY_SERVER, url).apply();
                                server = url;
                                showWeb(null);
                            }
                        });
                    }
                }).start();
            }
        };
        ok.setOnClickListener(new View.OnClickListener() { @Override public void onClick(View v) { go.run(); } });
        input.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override public boolean onEditorAction(TextView v, int id, KeyEvent e) { go.run(); return true; }
        });

        TextView ver = new TextView(this);
        ver.setText("Phiên bản ứng dụng " + versionName());
        ver.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        ver.setTextColor(0xFF888888);
        ver.setPadding(0, dp(24), 0, 0);
        box.addView(ver);

        root.addView(box, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
    }

    private static String normalize(String s) {
        s = s.trim();
        if (s.isEmpty()) return null;
        if (!s.startsWith("http://") && !s.startsWith("https://")) s = "http://" + s;
        while (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        Uri u = Uri.parse(s);
        if (u.getHost() == null || u.getHost().isEmpty()) return null;
        return u.getScheme() + "://" + u.getEncodedAuthority() + (u.getEncodedPath() == null ? "" : u.getEncodedPath());
    }

    /** Trả về null nếu máy chủ phản hồi đúng phần mềm QLDA, ngược lại là câu báo lỗi. */
    private static String checkHealth(String base) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(base + "/api/health").openConnection();
            c.setConnectTimeout(10000);
            c.setReadTimeout(10000);
            int code = c.getResponseCode();
            if (code == 200) return null;
            return "Máy chủ trả về mã " + code + ". Kiểm tra lại địa chỉ (có đúng phần mềm QLDA không?).";
        } catch (javax.net.ssl.SSLException e) {
            return "Chứng chỉ HTTPS của máy chủ không hợp lệ: " + e.getMessage();
        } catch (Exception e) {
            return "Không kết nối được: " + e.getMessage() + ". Kiểm tra mạng (Wi‑Fi nội bộ/VPN) và địa chỉ.";
        } finally {
            if (c != null) c.disconnect();
        }
    }

    // ---------- WebView ----------

    private void showWeb(Bundle state) {
        root.removeAllViews();
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setUserAgentString(s.getUserAgentString() + " QLDA-TTTS-Android/" + versionName());
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.addJavascriptInterface(new Bridge(), "QLDA");

        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                String scheme = u.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    if (isOwn(u)) {
                        if (u.getPath() != null && u.getPath().startsWith("/api/files/")) {
                            download(u.toString(), null, null);
                            return true;
                        }
                        return false;
                    }
                }
                openExternal(u);
                return true;
            }
            @Override public void onPageFinished(WebView v, String url) {
                progress.setVisibility(View.GONE);
                v.evaluateJavascript(BLOB_HOOK, null);
                CookieManager.getInstance().flush();
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) showError("Không tải được phần mềm: " + e.getDescription());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView v, int p) {
                progress.setVisibility(p < 100 ? View.VISIBLE : View.GONE);
                progress.setProgress(p);
            }
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                return openChooser(cb, p);
            }
        });
        web.setDownloadListener(new android.webkit.DownloadListener() {
            @Override public void onDownloadStart(String url, String ua, String cd, String mime, long len) {
                if (url.startsWith("blob:")) return; // đã xử lý bằng BLOB_HOOK
                download(url, cd, mime);
            }
        });

        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        root.addView(progress, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(4), Gravity.TOP));

        if (state == null || web.restoreState(state) == null) web.loadUrl(server + START_PATH);
    }

    private boolean isOwn(Uri u) {
        Uri s = Uri.parse(server);
        return s.getHost() != null && s.getHost().equalsIgnoreCase(u.getHost()) && s.getPort() == u.getPort();
    }

    private void showError(String msg) {
        if (errorView != null) root.removeView(errorView);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setBackgroundColor(Color.WHITE);
        box.setPadding(dp(24), dp(24), dp(24), dp(24));
        TextView t = new TextView(this);
        t.setText(msg + "\n\nMáy chủ: " + server);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        t.setGravity(Gravity.CENTER);
        t.setTextColor(0xFF333333);
        box.addView(t);
        Button retry = new Button(this);
        retry.setText("Thử lại");
        retry.setOnClickListener(new View.OnClickListener() { @Override public void onClick(View v) { hideError(); web.reload(); } });
        box.addView(retry);
        Button change = new Button(this);
        change.setText("Đổi máy chủ");
        change.setOnClickListener(new View.OnClickListener() { @Override public void onClick(View v) { errorView = null; showSetup(null); } });
        box.addView(change);
        errorView = box;
        root.addView(box, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private void hideError() {
        if (errorView != null) { root.removeView(errorView); errorView = null; }
    }

    // ---------- Chọn tệp / chụp ảnh ----------

    private boolean openChooser(ValueCallback<Uri[]> cb, WebChromeClient.FileChooserParams p) {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        fileCallback = cb;
        cameraUri = null;
        boolean image = false;
        String[] types = p.getAcceptTypes();
        if (types == null || types.length == 0) image = true;
        else for (String t : types) if (t == null || t.isEmpty() || t.startsWith("image") || t.equals("*/*")) image = true;

        Intent camera = null;
        if (image && Build.VERSION.SDK_INT >= 29) {
            try {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Images.Media.DISPLAY_NAME, "QLDA_" + System.currentTimeMillis() + ".jpg");
                cv.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                cv.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/QLDA TTTS");
                cameraUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                if (cameraUri != null) {
                    camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    camera.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                    camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                }
            } catch (Exception e) {
                cameraUri = null;
            }
        }

        Intent pick = p.createIntent();
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        if (p.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        Intent launch;
        if (camera != null && p.isCaptureEnabled()) launch = camera;
        else {
            launch = Intent.createChooser(pick, "Chọn tệp hoặc chụp ảnh");
            if (camera != null) launch.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
        }
        try {
            startActivityForResult(launch, REQ_FILE);
            return true;
        } catch (ActivityNotFoundException e) {
            dropCameraUri();
            fileCallback = null;
            toast("Máy không có ứng dụng chọn tệp.");
            return false;
        }
    }

    @Override
    protected void onActivityResult(int req, int code, Intent data) {
        if (req != REQ_FILE) { super.onActivityResult(req, code, data); return; }
        Uri[] result = null;
        if (code == RESULT_OK) {
            if (data != null && data.getClipData() != null) {
                int n = data.getClipData().getItemCount();
                result = new Uri[n];
                for (int i = 0; i < n; i++) result[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data != null && data.getData() != null) {
                result = new Uri[]{data.getData()};
            } else if (cameraUri != null) {
                result = new Uri[]{cameraUri};
            }
        }
        boolean usedCamera = result != null && result.length == 1 && cameraUri != null && cameraUri.equals(result[0]);
        if (!usedCamera) dropCameraUri();
        if (fileCallback != null) fileCallback.onReceiveValue(result);
        fileCallback = null;
        cameraUri = null;
    }

    private void dropCameraUri() {
        if (cameraUri != null) {
            try { getContentResolver().delete(cameraUri, null, null); } catch (Exception ignored) { }
            cameraUri = null;
        }
    }

    // ---------- Tải tệp về ----------

    private void download(String url, String contentDisposition, String mime) {
        try {
            String name = URLUtil.guessFileName(url, contentDisposition, mime);
            DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null) r.addRequestHeader("Cookie", cookie);
            r.addRequestHeader("User-Agent", web.getSettings().getUserAgentString());
            r.setTitle(name);
            r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            if (Build.VERSION.SDK_INT >= 29) r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "QLDA TTTS/" + name);
            else r.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, name);
            ((DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(r);
            toast("Đang tải " + name + " (xem trong thông báo)");
        } catch (Exception e) {
            toast("Không tải được tệp: " + e.getMessage());
        }
    }

    private class Bridge {
        @JavascriptInterface
        public void saveBase64(String name, String mime, String b64) {
            try {
                byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                String safe = name.replaceAll("[\\\\/:*?\"<>|]", "_");
                String where;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                    cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/QLDA TTTS");
                    Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    if (u == null) throw new IllegalStateException("không tạo được tệp");
                    OutputStream os = getContentResolver().openOutputStream(u);
                    try { os.write(bytes); } finally { os.close(); }
                    where = "Tải xuống/QLDA TTTS/" + safe;
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    File f = new File(dir, safe);
                    FileOutputStream os = new FileOutputStream(f);
                    try { os.write(bytes); } finally { os.close(); }
                    where = f.getAbsolutePath();
                }
                toast("Đã lưu " + where);
            } catch (Exception e) {
                toast("Không lưu được tệp: " + e.getMessage());
            }
        }

        @JavascriptInterface
        public void toast(String msg) { MainActivity.this.toast(msg); }
    }

    // ---------- Điều hướng ----------

    @Override
    public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        if (errorView != null) { hideError(); }
        if (web.canGoBack()) { web.goBack(); return; }
        new AlertDialog.Builder(this)
            .setTitle("QLDA TTTS")
            .setItems(new String[]{"Tải lại trang", "Đổi máy chủ (" + server + ")", "Thoát ứng dụng"}, new DialogInterface.OnClickListener() {
                @Override public void onClick(DialogInterface d, int which) {
                    if (which == 0) web.reload();
                    else if (which == 1) showSetup(null);
                    else finish();
                }
            })
            .show();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }

    private void openExternal(Uri u) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, u)); }
        catch (ActivityNotFoundException e) { toast("Không mở được liên kết."); }
    }

    private void toast(final String msg) {
        runOnUiThread(new Runnable() { @Override public void run() { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show(); } });
    }

    private String versionName() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; }
        catch (Exception e) { return "?"; }
    }

    private int dp(int v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }
}
