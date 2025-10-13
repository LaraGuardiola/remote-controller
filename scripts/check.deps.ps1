Write-Host "[INFO] Comprobando dependencias del sistema..."

# --- NODE.JS 20 LTS ---
$node = Get-Command node -ErrorAction SilentlyContinue
$nodeVersion = if ($node) { node --version } else { $null }

if (-not $node -or -not $nodeVersion.StartsWith("v20.")) {
    Write-Host "[WARN] Instalando Node.js 20.7.0..."
    winget install --id=OpenJS.NodeJS -v "20.7.0" -e
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-Host "[OK] Node.js: $(node --version)"
