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

function Get-RelativePath {
  param(
    [Parameter(Mandatory = $true)][string]$BasePath,
    [Parameter(Mandatory = $true)][string]$FilePath
  )

  $baseFull = [System.IO.Path]::GetFullPath($BasePath).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
  $fileFull = [System.IO.Path]::GetFullPath($FilePath)
  if (-not $fileFull.StartsWith($baseFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path is outside base path: $fileFull"
  }
  return $fileFull.Substring($baseFull.Length).Replace('\', '/')
}

function Get-MirroredFiles {
  $files = @()
  foreach ($item in $items) {
    $sourcePath = Join-Path $root $item.Source
    if ($item.Directory) {
      $files += Get-ChildItem -LiteralPath $sourcePath -Recurse -File | ForEach-Object {
        Get-RelativePath -BasePath $root -FilePath $_.FullName
      }
    } else {
      $files += $item.Source
    }
  }
  return $files | Sort-Object -Unique
}

$mismatches = @()
foreach ($relativeFile in Get-MirroredFiles) {
  $webFile = Join-Path $root $relativeFile
  $androidFile = Join-Path $target $relativeFile
  if (-not (Test-Path -LiteralPath $androidFile)) {
    $mismatches += "$relativeFile -> missing from Android assets"
    continue
  }
  $webHash = (Get-FileHash -LiteralPath $webFile -Algorithm SHA256).Hash
  $androidHash = (Get-FileHash -LiteralPath $androidFile -Algorithm SHA256).Hash
  if ($webHash -ne $androidHash) {
    $mismatches += "$relativeFile -> $relativeFile"
  }
}

$expected = @(Get-MirroredFiles)
$expectedSet = @{}
$expected | ForEach-Object { $expectedSet[$_] = $true }
$allowedTargetOnlyFiles = @(".gitignore")
$extraFiles = Get-ChildItem -LiteralPath $target -Recurse -File | ForEach-Object {
  Get-RelativePath -BasePath $target -FilePath $_.FullName
} | Where-Object { -not $expectedSet.ContainsKey($_) -and $allowedTargetOnlyFiles -notcontains $_ }

foreach ($extraFile in $extraFiles) {
  $mismatches += "$extraFile -> stale Android-only asset"
}

if ($mismatches.Count) {
  Write-Error ("Android asset sync mismatch:`n" + ($mismatches -join "`n"))
}

Write-Host "Android assets are in sync."
