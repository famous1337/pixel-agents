param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Source,

  [string]$AssetRoot = "$env:USERPROFILE\pixel-agents-tonone-assets",

  [switch]$MirrorToRepo,
  [string]$RepoRoot = "C:\repos\pixel-agents",

  [switch]$MirrorToInstalledExtension,
  [string]$ExtensionRoot = "$env:USERPROFILE\.vscode\extensions\pablodelucca.pixel-agents-1.3.0",

  [switch]$DryRun,
  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host "[pixel-assets] $Message"
}

function Get-SafeName([string]$Name) {
  $base = [IO.Path]::GetFileNameWithoutExtension($Name)
  $safe = ($base -replace '[^A-Za-z0-9]+', '_').Trim('_')
  if ([string]::IsNullOrWhiteSpace($safe)) { $safe = "asset" }
  return $safe
}

function Get-AssetId([string]$Name) {
  return (Get-SafeName $Name).ToUpperInvariant()
}

function Ensure-Directory([string]$Path) {
  if ($DryRun) {
    Write-Step "Would ensure directory: $Path"
    return
  }
  New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

function Copy-FileSafe([string]$From, [string]$To) {
  Ensure-Directory ([IO.Path]::GetDirectoryName($To))
  if ((Test-Path -LiteralPath $To) -and -not $Force) {
    Write-Step "Skipping existing file: $To"
    return $false
  }
  if ($DryRun) {
    Write-Step "Would copy: $From -> $To"
    return $true
  }
  Copy-Item -LiteralPath $From -Destination $To -Force:$Force
  return $true
}

function Write-Utf8NoBomJson([string]$Path, $Object) {
  Ensure-Directory ([IO.Path]::GetDirectoryName($Path))
  $json = $Object | ConvertTo-Json -Depth 12
  if ($DryRun) {
    Write-Step "Would write manifest: $Path"
    Write-Host $json
    return
  }
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($Path, $json, $encoding)
}

function Get-ImageSize([string]$Path) {
  Add-Type -AssemblyName System.Drawing
  $img = [System.Drawing.Image]::FromFile($Path)
  try {
    return [pscustomobject]@{ Width = $img.Width; Height = $img.Height }
  }
  finally {
    $img.Dispose()
  }
}

function Get-NextIndexedName([string]$Dir, [string]$Prefix) {
  Ensure-Directory $Dir
  $max = -1
  if (Test-Path -LiteralPath $Dir) {
    Get-ChildItem -LiteralPath $Dir -File -Filter "$Prefix*.png" | ForEach-Object {
      if ($_.BaseName -match "^$([regex]::Escape($Prefix))(\d+)$") {
        $max = [Math]::Max($max, [int]$Matches[1])
      }
    }
  }
  return "$Prefix$($max + 1).png"
}

function Get-RelativeHint([string]$Path, [string]$Root) {
  $full = [IO.Path]::GetFullPath($Path).ToLowerInvariant()
  $rootFull = [IO.Path]::GetFullPath($Root).ToLowerInvariant()
  if ($full.StartsWith($rootFull)) {
    return $full.Substring($rootFull.Length)
  }
  return $full
}

function Get-AssetKind([IO.FileInfo]$File, [string]$WorkRoot) {
  $hint = Get-RelativeHint $File.FullName $WorkRoot
  $name = $File.Name.ToLowerInvariant()

  if ($name -match '^char_\d+\.png$' -or $hint -match 'character|sprite|avatar|agent|person|cyberpunk.*char') {
    return "character"
  }
  if ($name -match '^floor_\d+\.png$' -or $hint -match 'floor|ground|tile') {
    return "floor"
  }
  if ($name -match '^wall_\d+\.png$' -or $hint -match 'wall') {
    return "wall"
  }
  return "furniture"
}

function Get-FurnitureCategory([IO.FileInfo]$File) {
  $hint = ($File.FullName + " " + $File.BaseName).ToLowerInvariant()
  if ($hint -match 'chair|seat|stool|bench') { return "chairs" }
  if ($hint -match 'desk|table|counter|workstation') { return "desks" }
  if ($hint -match 'shelf|cabinet|locker|crate|storage|rack') { return "storage" }
  if ($hint -match 'screen|monitor|terminal|server|computer|pc|console|holo|core|data|neon|tech') { return "electronics" }
  if ($hint -match 'poster|sign|panel|wall') { return "wall" }
  if ($hint -match 'plant|rug|decor|lamp|statue') { return "decor" }
  return "misc"
}

function Install-ManifestFurnitureFolder([IO.DirectoryInfo]$Folder, [string]$DestinationRoot) {
  $dest = Join-Path $DestinationRoot ("assets\furniture\" + $Folder.Name)
  if ((Test-Path -LiteralPath $dest) -and -not $Force) {
    Write-Step "Skipping existing furniture folder: $dest"
    return
  }
  Ensure-Directory (Split-Path -Parent $dest)
  if ($DryRun) {
    Write-Step "Would copy manifest furniture folder: $($Folder.FullName) -> $dest"
    return
  }
  Copy-Item -LiteralPath $Folder.FullName -Destination $dest -Recurse -Force:$Force

  $manifest = Join-Path $dest "manifest.json"
  if (Test-Path -LiteralPath $manifest) {
    $parsed = Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json
    Write-Utf8NoBomJson $manifest $parsed
  }
}

function Install-LoosePng([IO.FileInfo]$File, [string]$WorkRoot, [string]$DestinationRoot) {
  $kind = Get-AssetKind $File $WorkRoot
  switch ($kind) {
    "character" {
      $targetDir = Join-Path $DestinationRoot "assets\characters"
      $targetName = if ($File.Name -match '^char_\d+\.png$') { $File.Name } else { Get-NextIndexedName $targetDir "char_" }
      Copy-FileSafe $File.FullName (Join-Path $targetDir $targetName) | Out-Null
      Write-Step "Installed character: $($File.Name) -> $targetName"
    }
    "floor" {
      $targetDir = Join-Path $DestinationRoot "assets\floors"
      $targetName = if ($File.Name -match '^floor_\d+\.png$') { $File.Name } else { Get-NextIndexedName $targetDir "floor_" }
      Copy-FileSafe $File.FullName (Join-Path $targetDir $targetName) | Out-Null
      Write-Step "Installed floor: $($File.Name) -> $targetName"
    }
    "wall" {
      $targetDir = Join-Path $DestinationRoot "assets\walls"
      $targetName = if ($File.Name -match '^wall_\d+\.png$') { $File.Name } else { Get-NextIndexedName $targetDir "wall_" }
      Copy-FileSafe $File.FullName (Join-Path $targetDir $targetName) | Out-Null
      Write-Step "Installed wall set: $($File.Name) -> $targetName"
    }
    default {
      $id = Get-AssetId $File.Name
      $targetDir = Join-Path $DestinationRoot ("assets\furniture\" + $id)
      $targetPng = Join-Path $targetDir "$id.png"
      $size = Get-ImageSize $File.FullName
      $category = Get-FurnitureCategory $File
      $manifest = [ordered]@{
        id = $id
        name = (Get-SafeName $File.Name).Replace('_', ' ')
        category = $category
        type = "asset"
        file = "$id.png"
        canPlaceOnWalls = ($category -eq "wall")
        canPlaceOnSurfaces = $false
        backgroundTiles = 0
        width = $size.Width
        height = $size.Height
        footprintW = [Math]::Max(1, [Math]::Ceiling($size.Width / 16))
        footprintH = [Math]::Max(1, [Math]::Ceiling($size.Height / 16))
      }

      Copy-FileSafe $File.FullName $targetPng | Out-Null
      Write-Utf8NoBomJson (Join-Path $targetDir "manifest.json") $manifest
      Write-Step "Installed furniture: $($File.Name) -> $id ($category)"
    }
  }
}

function Install-IntoRoot([string]$WorkRoot, [string]$DestinationRoot) {
  Ensure-Directory (Join-Path $DestinationRoot "assets")

  $manifestFolders = Get-ChildItem -LiteralPath $WorkRoot -Recurse -File -Filter "manifest.json" |
    ForEach-Object { $_.Directory } |
    Sort-Object FullName -Unique

  $manifestFolderSet = @{}
  foreach ($folder in $manifestFolders) {
    $manifestFolderSet[[IO.Path]::GetFullPath($folder.FullName).ToLowerInvariant()] = $true
    Install-ManifestFurnitureFolder $folder $DestinationRoot
  }

  $pngs = Get-ChildItem -LiteralPath $WorkRoot -Recurse -File -Filter "*.png"
  foreach ($png in $pngs) {
    $pngDir = [IO.Path]::GetFullPath($png.DirectoryName).ToLowerInvariant()
    if ($manifestFolderSet.ContainsKey($pngDir)) { continue }
    Install-LoosePng $png $WorkRoot $DestinationRoot
  }
}

$resolvedSource = Resolve-Path -LiteralPath $Source
$sourceItem = Get-Item -LiteralPath $resolvedSource
$workRoot = $sourceItem.FullName
$tempDir = $null

try {
  if (-not $sourceItem.PSIsContainer -and $sourceItem.Extension -match '^\.zip$') {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $tempDir = Join-Path ([IO.Path]::GetTempPath()) ("pixel-assets-" + [Guid]::NewGuid().ToString("N"))
    Ensure-Directory $tempDir
    if (-not $DryRun) {
      [System.IO.Compression.ZipFile]::ExtractToDirectory($sourceItem.FullName, $tempDir)
    }
    $workRoot = $tempDir
    Write-Step "Extracted zip to: $tempDir"
  }

  $destinations = @($AssetRoot)
  if ($MirrorToRepo) {
    $destinations += $RepoRoot
    $destinations += (Join-Path $RepoRoot "dist")
    $destinations += (Join-Path $RepoRoot "webview-ui\public")
  }
  if ($MirrorToInstalledExtension) {
    $destinations += (Join-Path $ExtensionRoot "dist")
  }

  foreach ($destination in ($destinations | Select-Object -Unique)) {
    Write-Step "Installing into: $destination"
    Install-IntoRoot $workRoot $destination
  }

  Write-Step "Done. Reload VS Code after installing new assets."
}
finally {
  if ($tempDir -and (Test-Path -LiteralPath $tempDir) -and -not $DryRun) {
    Remove-Item -LiteralPath $tempDir -Recurse -Force
  }
}
