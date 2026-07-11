# Start local dev server and open browser
$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
$NodeExe = "C:\Program Files\nodejs\node.exe"
$NpmCmd = "C:\Program Files\nodejs\npm.cmd"
$Url = "http://localhost:3000"
$Port = 3000

Write-Host ""
Write-Host "========================================"
Write-Host "  AL-MASQI Social Activity Center"
Write-Host "========================================"
Write-Host ""

if (-not (Test-Path $NodeExe)) {
    Write-Host "[ERROR] Node.js is not installed."
    Write-Host "Download from: https://nodejs.org"
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing packages for the first time..."
    & $NpmCmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install packages."
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host ""
}

function Test-ServerRunning {
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return [bool]$conn
    }
    catch {
        return $false
    }
}

$serverRunning = Test-ServerRunning

if (-not $serverRunning) {
    Write-Host "Starting server..."
    $serverCmd = 'cd /d "' + $ProjectDir + '" && set PATH=C:\Program Files\nodejs;%PATH% && npm run dev'
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $serverCmd
    Write-Host "Waiting for server to start..."

    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-ServerRunning) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        Write-Host "[WARNING] Server did not start yet. Check the server window."
    }
}
else {
    Write-Host "Server is already running on port $Port"
}

Write-Host "Opening browser..."
Start-Process $Url

Write-Host ""
Write-Host "Done! Website: $Url"
Write-Host "Do not close the server window while using the site."
Write-Host ""
Read-Host "Press Enter to exit"
