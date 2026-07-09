@echo off
REM 双击这个文件即可：同步镜像 -> 升版本 -> 构建签名 APK -> 导出到项目根目录。
REM 只升 versionCode（改题库/规则的日常更新用这个）。
REM 如需升版本名，改用命令行：pwsh -File scripts\release-apk.ps1 -Bump patch  （或 -Bump minor）
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\release-apk.ps1" %*
echo.
pause
