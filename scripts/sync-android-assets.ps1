param(
  [switch]$Check
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$target = Resolve-Path (Join-Path $root "android/app/src/main/assets/www")

function Assert-InWorkspace {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Workspace
  )

  $resolvedPath = [System.IO.Path]::GetFullPath($Path)
  $resolvedWorkspace = [System.IO.Path]::GetFullPath($Workspace)
  if (-not $resolvedPath.StartsWith($resolvedWorkspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to sync outside workspace: $resolvedPath"
  }
}

Assert-InWorkspace -Path $target -Workspace $root

$items = @(
  @{ Source = "index.html"; Target = "index.html"; Directory = $false },
  @{ Source = "manifest.webmanifest"; Target = "manifest.webmanifest"; Directory = $false },
  @{ Source = "css"; Target = "css"; Directory = $true },
  @{ Source = "js"; Target = "js"; Directory = $true },
  @{ Source = "assets"; Target = "assets"; Directory = $true }
)

if (-not $Check) {
  foreach ($item in $items) {
    $sourcePath = Join-Path $root $item.Source
    $targetPath = Join-Path $target $item.Target
    Assert-InWorkspace -Path $targetPath -Workspace $target
    if ($item.Directory) {
      Copy-Item -LiteralPath $sourcePath -Destination $target -Recurse -Force
    } else {
      Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
    }
  }
}

$pairs = @(
  @("index.html", "index.html"),
  @("manifest.webmanifest", "manifest.webmanifest"),
  @("css/themes.css", "css/themes.css"),
  @("js/app.js", "js/app.js"),
  @("js/home-route.js", "js/home-route.js"),
  @("js/pet-dressup-meta.js", "js/pet-dressup-meta.js"),
  @("js/pet-economy.js", "js/pet-economy.js"),
  @("js/question-bank.js", "js/question-bank.js")
)

$mismatches = @()
foreach ($pair in $pairs) {
  $webFile = Join-Path $root $pair[0]
  $androidFile = Join-Path $target $pair[1]
  $webHash = (Get-FileHash -LiteralPath $webFile -Algorithm SHA256).Hash
  $androidHash = (Get-FileHash -LiteralPath $androidFile -Algorithm SHA256).Hash
  if ($webHash -ne $androidHash) {
    $mismatches += "$($pair[0]) -> $($pair[1])"
  }
}

if ($mismatches.Count) {
  Write-Error ("Android asset sync mismatch:`n" + ($mismatches -join "`n"))
}

Write-Host "Android assets are in sync."
