$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
Push-Location $projectRoot
try {
    flutter pub get
    if ($LASTEXITCODE -ne 0) { throw "flutter pub get failed with exit code $LASTEXITCODE" }

    dart format --set-exit-if-changed lib test
    if ($LASTEXITCODE -ne 0) { throw "dart format failed with exit code $LASTEXITCODE" }

    flutter analyze
    if ($LASTEXITCODE -ne 0) { throw "flutter analyze failed with exit code $LASTEXITCODE" }

    flutter test --reporter expanded
    if ($LASTEXITCODE -ne 0) { throw "flutter test failed with exit code $LASTEXITCODE" }

    flutter build windows --release
    if ($LASTEXITCODE -ne 0) { throw "flutter build windows failed with exit code $LASTEXITCODE" }

    $releaseDir = Join-Path $projectRoot 'build\windows\x64\runner\Release'
    $exe = Join-Path $releaseDir 'YGNTV.Desktop.exe'
    if (-not (Test-Path -LiteralPath $exe)) { throw "Expected Windows executable was not produced: $exe" }

    $zipPath = Join-Path $projectRoot 'YGNTV-Desktop-Windows.zip'
    if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
    Compress-Archive -Path (Join-Path $releaseDir '*') -DestinationPath $zipPath -CompressionLevel Optimal

    Write-Host "Windows app: $exe"
    Write-Host "Bundle ZIP:  $zipPath"
} finally {
    Pop-Location
}
