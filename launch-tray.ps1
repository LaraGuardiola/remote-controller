# Launch server with system tray icon
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Configuration
$exePath = Join-Path $PSScriptRoot "remote-controller.exe"
$iconPath = Join-Path $PSScriptRoot "./assets/icon.ico"  # Opcional: pon tu propio icono aquí

# Verify executable exists
if (-not (Test-Path $exePath)) {
    [System.Windows.Forms.MessageBox]::Show(
        "No se encontró el archivo server.exe en la ruta: $exePath",
        "Error",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    )
    exit 1
}

# Start the process hidden
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $exePath
$processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$processInfo.CreateNoWindow = $true
$process = [System.Diagnostics.Process]::Start($processInfo)

# Create notification icon
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon

# Set icon (use default if custom icon doesn't exist)
if (Test-Path $iconPath) {
    $notifyIcon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($iconPath)
} else {
    # Use a default system icon
    $notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
}

$notifyIcon.Text = "Remote Controller"
$notifyIcon.Visible = $true

# Create context menu
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

# Menu item: Open browser
# $openBrowserItem = New-Object System.Windows.Forms.ToolStripMenuItem
# $openBrowserItem.Text = "Abrir en navegador"
# $openBrowserItem.Add_Click({
#     Start-Process "http://localhost:3000"  # Ajusta el puerto si es necesario
# })
# $contextMenu.Items.Add($openBrowserItem)

# # Separator
# $contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

# Menu item: Stop server
$stopItem = New-Object System.Windows.Forms.ToolStripMenuItem
$stopItem.Text = "Stop remote controller"
$stopItem.Add_Click({
    if (-not $process.HasExited) {
        $process.Kill()
        $process.WaitForExit()
    }
    $notifyIcon.Visible = $false
    $notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
})
$contextMenu.Items.Add($stopItem)

# Assign context menu to notify icon
$notifyIcon.ContextMenuStrip = $contextMenu

# Double-click to open browser
# $notifyIcon.Add_DoubleClick({
#     Start-Process "http://localhost:5173"  # Ajusta el puerto si es necesario
# })

# Show initial notification
# $notifyIcon.BalloonTipTitle = "Servidor iniciado"
# $notifyIcon.BalloonTipText = "El servidor de Remote Trackpad está funcionando"
# $notifyIcon.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
$notifyIcon.ShowBalloonTip(3000)

# Keep the script running
$appContext = New-Object System.Windows.Forms.ApplicationContext
[System.Windows.Forms.Application]::Run($appContext)

# Cleanup on exit
if (-not $process.HasExited) {
    $process.Kill()
}
$notifyIcon.Dispose()
