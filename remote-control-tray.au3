#NoTrayIcon
#Region ;**** Directives created by AutoIt3Wrapper_GUI ****
#AutoIt3Wrapper_Icon=assets\icon.ico
#AutoIt3Wrapper_Res_requestedExecutionLevel=requireAdministrator
#AutoIt3Wrapper_UseUpx=n
#EndRegion

; Ruta a tu ejecutable compilado con Bun
$sAppPath = @ScriptDir & "\remote-controller.exe"

; Verificar que existe
If Not FileExists($sAppPath) Then
    MsgBox(16, "Error", "RemoteController.exe not found")
    Exit
EndIf

; Iniciar tu .exe de Bun completamente oculto
$hProcess = Run($sAppPath, @ScriptDir, @SW_HIDE)

; Verificar que se inició correctamente
If @error Then
    MsgBox(16, "Error", "Failed to start the server")
    Exit
EndIf

; Configurar bandeja del sistema
Opt("TrayMenuMode", 3)
Opt("TrayOnEventMode", 1)

; Configurar icono (primero intenta cargar el externo, si no usa el del exe)
Local $sIconPath = @ScriptDir & "\assets\icon.ico"
If FileExists($sIconPath) Then
    TraySetIcon($sIconPath)
Else
    TraySetIcon(@ScriptFullPath, 0) ; Usa el icono del propio exe
EndIf

TraySetToolTip("Remote Controller")

; Notificación de inicio
TrayTip("Remote Controller", "Server started correctly", 3, 1)

; Crear menu simple

$idQuit = TrayCreateItem("Quit")
TrayItemSetOnEvent(-1, "Quit")

; Mostrar icono en bandeja
TraySetState(1)

; Loop infinito
While 1
    If Not ProcessExists($hProcess) Then
        Exit
    EndIf
    Sleep(5000)
WEnd

; Funciones
Func OpenInBrowser()
    ShellExecute("http://localhost:5173")
EndFunc

Func Quit()
    If ProcessExists($hProcess) Then
        ProcessClose($hProcess)
    EndIf
    Exit
EndFunc
