# Android 构建说明

生成日期：2026/07/08

Web 根目录是主源，Android WebView 目录只是镜像：`android/app/src/main/assets/www/`。改动 `index.html`、`css/`、`js/`、`assets/` 后，先同步再构建。

## 常用命令

```powershell
$ErrorActionPreference = 'Stop'
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/sync-android-assets.ps1
npm run sync:android:check
```

## 调试构建

```powershell
$ErrorActionPreference = 'Stop'
Set-Location android
./gradlew.bat assembleDebug
```

输出通常在：

- `android/app/build/outputs/apk/debug/app-debug.apk`

## 发布构建

```powershell
$ErrorActionPreference = 'Stop'
Set-Location android
./gradlew.bat assembleRelease
```

输出通常在：

- `android/app/build/outputs/apk/release/app-release.apk`

发布包是否可直接安装，取决于 Android 项目的签名配置。若本机没有 release keystore，需要先补齐签名配置，或使用 debug 包做本地安装测试。

## 构建前检查

- 运行 `npm test`，确认题库、页面结构和浏览器冒烟测试通过。
- 运行 `npm run sync:android:check`，确认 Web 与 Android 镜像一致。
- 不要把 `Reference/` 原始 PDF 或 `tmp/` 中间产物打包进应用。
- 生成 APK 后，确认 `.gitignore` 仍然忽略构建产物，避免误提交大文件。
