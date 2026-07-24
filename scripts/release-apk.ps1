param(
  # 版本名升级方式：none=只升 versionCode（默认，适合改题库/规则的小更新）；
  # patch=1.2.0->1.2.1；minor=1.2.0->1.3.0。versionCode 永远自动 +1。
  [ValidateSet("none", "patch", "minor")]
  [string]$Bump = "none",
  # 跳过 npm 测试（默认会先跑测试兜底）。
  [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$gradleFile = Join-Path $root "android/app/build.gradle"
$pkgFile = Join-Path $root "package.json"

Write-Host "==> 一键构建 APK 开始" -ForegroundColor Cyan

# 1. 可选：先跑测试兜底
if (-not $SkipTests) {
  Write-Host "==> [1/5] 运行测试 (npm test)..." -ForegroundColor Cyan
  Push-Location $root
  try {
    npm test
    if ($LASTEXITCODE -ne 0) { throw "测试未通过，已中止构建。用 -SkipTests 可跳过。" }
  } finally {
    Pop-Location
  }
} else {
  Write-Host "==> [1/5] 已跳过测试 (-SkipTests)" -ForegroundColor Yellow
}

# 2. 同步 Android 镜像（复用现有同步脚本）
Write-Host "==> [2/5] 同步 Android 资源镜像..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "sync-android-assets.ps1")
& (Join-Path $PSScriptRoot "sync-android-assets.ps1") -Check

# 3. 升版本号
Write-Host "==> [3/5] 更新版本号..." -ForegroundColor Cyan
$gradle = Get-Content -LiteralPath $gradleFile -Raw -Encoding UTF8

# versionCode 永远 +1
$codeMatch = [regex]::Match($gradle, 'versionCode\s+(\d+)')
if (-not $codeMatch.Success) { throw "在 build.gradle 找不到 versionCode。" }
$oldCode = [int]$codeMatch.Groups[1].Value
$newCode = $oldCode + 1

# versionName 按需升
$nameMatch = [regex]::Match($gradle, 'versionName\s+"([0-9]+)\.([0-9]+)\.([0-9]+)"')
if (-not $nameMatch.Success) { throw "在 build.gradle 找不到 versionName（需 x.y.z 格式）。" }
$major = [int]$nameMatch.Groups[1].Value
$minor = [int]$nameMatch.Groups[2].Value
$patch = [int]$nameMatch.Groups[3].Value
$oldName = "$major.$minor.$patch"
switch ($Bump) {
  "patch" { $patch += 1 }
  "minor" { $minor += 1; $patch = 0 }
  default { }
}
$newName = "$major.$minor.$patch"

$gradle = $gradle -replace "versionCode\s+$oldCode", "versionCode $newCode"
$gradle = $gradle -replace 'versionName\s+"[0-9]+\.[0-9]+\.[0-9]+"', "versionName `"$newName`""
Set-Content -LiteralPath $gradleFile -Value $gradle -NoNewline -Encoding UTF8

# package.json 的 version 与 versionName 保持一致
$pkg = Get-Content -LiteralPath $pkgFile -Raw -Encoding UTF8
$pkg = $pkg -replace '"version":\s*"[0-9]+\.[0-9]+\.[0-9]+"', "`"version`": `"$newName`""
Set-Content -LiteralPath $pkgFile -Value $pkg -NoNewline -Encoding UTF8

Write-Host ("    versionCode {0} -> {1}；versionName {2} -> {3}" -f $oldCode, $newCode, $oldName, $newName)

# 4. 构建签名 release APK
Write-Host "==> [4/5] 构建签名 release APK（约 1-2 分钟）..." -ForegroundColor Cyan
if (-not $env:KEYSTORE_PASSWORD -or -not $env:KEY_PASSWORD) {
  throw "缺少 KEYSTORE_PASSWORD 或 KEY_PASSWORD 环境变量，拒绝使用源码中的默认口令构建。"
}
Push-Location (Join-Path $root "android")
try {
  & ".\gradlew.bat" assembleRelease --no-daemon
  if ($LASTEXITCODE -ne 0) { throw "gradle 构建失败。" }
} finally {
  Pop-Location
}

# 5. 复制到根目录并按版本命名
Write-Host "==> [5/5] 导出 APK..." -ForegroundColor Cyan
$builtApk = Join-Path $root "android/app/build/outputs/apk/release/app-release.apk"
if (-not (Test-Path -LiteralPath $builtApk)) { throw "找不到构建产物：$builtApk" }
$outApk = Join-Path $root "MiaoMiaoMath-v$newName-release.apk"
Copy-Item -LiteralPath $builtApk -Destination $outApk -Force

$sizeMB = [math]::Round((Get-Item -LiteralPath $outApk).Length / 1MB, 1)
Write-Host ""
Write-Host "==> 完成！" -ForegroundColor Green
Write-Host ("    APK: {0}" -f $outApk) -ForegroundColor Green
Write-Host ("    版本: {0} (versionCode {1})  大小: {2} MB" -f $newName, $newCode, $sizeMB) -ForegroundColor Green
Write-Host "    传到手机点击安装即可（覆盖旧版，数据保留）。" -ForegroundColor Green
