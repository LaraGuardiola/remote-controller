Write-Host "[INFO] Instalando dependencias del proyecto..."

# Refrescar PATH para que npx esté disponible
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Set-Location -Path $PSScriptRoot\..

npx -y pnpm@latest install --no-frozen-lockfile

Write-Host "[DONE]"
