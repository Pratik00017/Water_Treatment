$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       AquaXAI FRONTEND MERGE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$Base = Split-Path -Parent $MyInvocation.MyCommand.Path

$OldZip  = Join-Path $Base "Aqua_XAI(2).zip"
$FrontZip = Join-Path $Base "AquaXAI_professional_frontend.zip"

$Work = Join-Path $Base "AquaXAI_Merge_Work"
$OldExtract = Join-Path $Work "Old"
$FrontExtract = Join-Path $Work "Frontend"
$OutputFolder = Join-Path $Work "Aqua_XAI"
$OutputZip = Join-Path $Base "Aqua_XAI_merged.zip"

# Check files
if (!(Test-Path $OldZip)) {
    Write-Host "ERROR: Aqua_XAI(2).zip not found." -ForegroundColor Red
    exit 1
}

if (!(Test-Path $FrontZip)) {
    Write-Host "ERROR: AquaXAI_professional_frontend.zip not found." -ForegroundColor Red
    exit 1
}

# Clean previous work
if (Test-Path $Work) {
    Remove-Item $Work -Recurse -Force
}

if (Test-Path $OutputZip) {
    Remove-Item $OutputZip -Force
}

New-Item -ItemType Directory -Path $OldExtract | Out-Null
New-Item -ItemType Directory -Path $FrontExtract | Out-Null

Write-Host ""
Write-Host "Extracting old Aqua_XAI project..." -ForegroundColor Yellow

Expand-Archive `
    -Path $OldZip `
    -DestinationPath $OldExtract `
    -Force

Write-Host "Extracting professional frontend..." -ForegroundColor Yellow

Expand-Archive `
    -Path $FrontZip `
    -DestinationPath $FrontExtract `
    -Force

# Find actual roots
function Get-ProjectRoot($Path) {

    $items = Get-ChildItem -Path $Path -Force

    $directories = @(
        $items | Where-Object {
            $_.PSIsContainer -and $_.Name -ne "__MACOSX"
        }
    )

    $files = @(
        $items | Where-Object {
            !$_.PSIsContainer
        }
    )

    if ($files.Count -eq 0 -and $directories.Count -eq 1) {
        return $directories[0].FullName
    }

    return $Path
}

$OldRoot = Get-ProjectRoot $OldExtract
$FrontRoot = Get-ProjectRoot $FrontExtract

Write-Host ""
Write-Host "Old project root:" -ForegroundColor Gray
Write-Host $OldRoot

Write-Host "Frontend package root:" -ForegroundColor Gray
Write-Host $FrontRoot

# Copy complete OLD project first
Write-Host ""
Write-Host "Copying old project..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path $OutputFolder | Out-Null

Copy-Item `
    -Path (Join-Path $OldRoot "*") `
    -Destination $OutputFolder `
    -Recurse `
    -Force

# Find professional frontend
$ProfessionalFrontend = Join-Path $FrontRoot "frontend"

if (!(Test-Path $ProfessionalFrontend)) {

    # If ZIP itself is already the frontend folder
    if (
        (Test-Path (Join-Path $FrontRoot "package.json")) -and
        (Test-Path (Join-Path $FrontRoot "src"))
    ) {
        $ProfessionalFrontend = $FrontRoot
    }
    else {
        $found = Get-ChildItem `
            -Path $FrontRoot `
            -Directory `
            -Recurse `
            -ErrorAction SilentlyContinue |
            Where-Object {
                (Test-Path (Join-Path $_.FullName "package.json")) -and
                (Test-Path (Join-Path $_.FullName "src"))
            } |
            Select-Object -First 1

        if ($found) {
            $ProfessionalFrontend = $found.FullName
        }
    }
}

if (!(Test-Path $ProfessionalFrontend)) {
    Write-Host ""
    Write-Host "ERROR: Professional frontend folder could not be located." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Professional frontend found:" -ForegroundColor Green
Write-Host $ProfessionalFrontend

# Remove ONLY old frontend
$OldFrontend = Join-Path $OutputFolder "frontend"

Write-Host ""
Write-Host "Replacing old frontend..." -ForegroundColor Yellow

if (Test-Path $OldFrontend) {
    Remove-Item $OldFrontend -Recurse -Force
}

# Copy professional frontend
New-Item -ItemType Directory -Path $OldFrontend | Out-Null

Copy-Item `
    -Path (Join-Path $ProfessionalFrontend "*") `
    -Destination $OldFrontend `
    -Recurse `
    -Force

# IMPORTANT:
# Restore old backend-related project files automatically remain untouched.
# Nothing under backend is modified.

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "MERGE COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host ""
Write-Host "Checking required folders..." -ForegroundColor Cyan

$Checks = @(
    (Join-Path $OutputFolder "backend"),
    (Join-Path $OutputFolder "frontend")
)

foreach ($Check in $Checks) {

    if (Test-Path $Check) {
        Write-Host "[OK] $Check" -ForegroundColor Green
    }
    else {
        Write-Host "[MISSING] $Check" -ForegroundColor Red
    }
}

# Create final ZIP
Write-Host ""
Write-Host "Creating final merged ZIP..." -ForegroundColor Yellow

Compress-Archive `
    -Path $OutputFolder `
    -DestinationPath $OutputZip `
    -CompressionLevel Optimal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "FINAL FILE CREATED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host $OutputZip -ForegroundColor White
Write-Host ""

$SizeMB = [math]::Round(
    (Get-Item $OutputZip).Length / 1MB,
    2
)

Write-Host "Final ZIP size: $SizeMB MB" -ForegroundColor Cyan

Write-Host ""
Write-Host "Backend was preserved." -ForegroundColor Green
Write-Host "Only the frontend was replaced." -ForegroundColor Green
Write-Host ""