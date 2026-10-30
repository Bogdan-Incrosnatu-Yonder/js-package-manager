<#
.SYNOPSIS
  Times install / build / test for each project in the lab.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\benchmark.ps1
  powershell -ExecutionPolicy Bypass -File scripts\benchmark.ps1 -Cold
  powershell -ExecutionPolicy Bypass -File scripts\benchmark.ps1 -Only npm,pnpm -Runs 3
#>
[CmdletBinding()]
param(
  [switch]$Cold,
  [int]$Runs = 1,
  [string[]]$Only,
  [switch]$SkipBuild,
  [switch]$SkipTest
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $PSScriptRoot
$Csv  = Join-Path $Root 'benchmark-results.csv'

$Projects = @(
  [pscustomobject]@{ Name='npm';  Folder='01-npm';  Bin='npm';  Install='npm install';  Build='npm run build:dev';  Test='npm run test:ci';  Lock='package-lock.json'; Clear='npm cache clean --force' }
  [pscustomobject]@{ Name='yarn'; Folder='02-yarn'; Bin='yarn'; Install='yarn install'; Build='yarn build:dev';     Test='yarn test:ci';     Lock='yarn.lock';        Clear='yarn cache clean --all' }
  [pscustomobject]@{ Name='pnpm'; Folder='03-pnpm'; Bin='pnpm'; Install='pnpm install'; Build='pnpm build:dev';     Test='pnpm test:ci';     Lock='pnpm-lock.yaml';   Clear='pnpm store prune' }
  [pscustomobject]@{ Name='bun';  Folder='04-bun';  Bin='bun';  Install='bun install';  Build='bun run build:dev';  Test='bun run test:ci';  Lock='bun.lock';         Clear='bun pm cache rm' }
  [pscustomobject]@{ Name='deno'; Folder='05-deno'; Bin='deno'; Install='deno install'; Build='deno task build:dev';Test='deno task test:ci';Lock='deno.lock';        Clear='deno clean' }
)

function Test-Tool([string]$name) { $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }

function Measure-Command-Seconds([string]$WorkDir, [string]$Command) {
  Push-Location $WorkDir
  try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    cmd /c "$Command" > $null 2>&1
    $ok = ($LASTEXITCODE -eq 0)
    $sw.Stop()
    if ($ok) { return [math]::Round($sw.Elapsed.TotalSeconds, 2) } else { return 'fail' }
  } finally { Pop-Location }
}

function Get-DirSizeMB([string]$Path) {
  if (-not (Test-Path $Path)) { return 0 }
  $bytes = (Get-ChildItem $Path -Recurse -File -ErrorAction SilentlyContinue |
            Measure-Object -Property Length -Sum).Sum
  return [math]::Round($bytes / 1MB, 0)
}

$mode = if ($Cold) { 'cold' } else { 'warm' }
Write-Host ""
Write-Host "  Angular Package Manager Lab - benchmark"
Write-Host "  mode: $mode   runs: $Runs"
Write-Host "  node: $(node --version)   os: $([System.Environment]::OSVersion.VersionString)"
Write-Host ""

"tool,version,install_s,node_modules_mb,build_s,test_s,mode,runs" | Set-Content $Csv
$rows = @()

foreach ($p in $Projects) {
  if ($Only -and ($Only -notcontains $p.Name)) { continue }

  $dir = Join-Path $Root "projects\$($p.Folder)"
  if (-not (Test-Path $dir)) { continue }

  if (-not (Test-Tool $p.Bin)) {
    Write-Host ("  {0,-6} not installed - skipping" -f $p.Name)
    $rows += [pscustomobject]@{ Tool=$p.Name; Version='not installed'; Install='-'; Size='-'; Build='-'; Test='-' }
    "$($p.Name),not installed,,,,,$mode,$Runs" | Add-Content $Csv
    continue
  }

  $version = (& $p.Bin --version 2>$null | Select-Object -First 1)
  Write-Host ("  {0,-6} {1}" -f $p.Name, $version)

  $times = @()
  for ($i = 1; $i -le $Runs; $i++) {
    foreach ($d in 'node_modules','dist','.angular','coverage') {
      Remove-Item (Join-Path $dir $d) -Recurse -Force -ErrorAction SilentlyContinue
    }
    if ($Cold) {
      Remove-Item (Join-Path $dir $p.Lock) -Force -ErrorAction SilentlyContinue
      Push-Location $dir; cmd /c $p.Clear > $null 2>&1; Pop-Location
    }
    Write-Host ("         install run {0}/{1} ... " -f $i, $Runs) -NoNewline
    $t = Measure-Command-Seconds $dir $p.Install
    Write-Host "$t s"
    $times += $t
  }

  $numeric = @($times | Where-Object { $_ -ne 'fail' })
  $installS = if ($numeric.Count) {
    $sorted = $numeric | Sort-Object
    $sorted[[math]::Floor($sorted.Count / 2)]
  } else { 'fail' }

  $sizeMb = Get-DirSizeMB (Join-Path $dir 'node_modules')

  $buildS = 'skip'
  if (-not $SkipBuild) {
    Write-Host "         build ... " -NoNewline
    $buildS = Measure-Command-Seconds $dir $p.Build
    Write-Host "$buildS s"
  }

  $testS = 'skip'
  if (-not $SkipTest) {
    Write-Host "         test  ... " -NoNewline
    $testS = Measure-Command-Seconds $dir $p.Test
    Write-Host "$testS s"
  }

  $rows += [pscustomobject]@{ Tool=$p.Name; Version=$version; Install=$installS; Size=$sizeMb; Build=$buildS; Test=$testS }
  "$($p.Name),$version,$installS,$sizeMb,$buildS,$testS,$mode,$Runs" | Add-Content $Csv
}

Write-Host ""
$rows | Format-Table -AutoSize
Write-Host "  CSV written to $Csv"
Write-Host "  Reminder: these sizes overcount pnpm hard links. See docs/BENCHMARKING.md."
Write-Host ""
