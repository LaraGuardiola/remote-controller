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
    MsgBox(16, "Error", "No se encuentra remote-controller.exe")
    Exit
EndIf

; Iniciar tu .exe de Bun completamente oculto
$hProcess = Run($sAppPath, @ScriptDir, @SW_HIDE)

; Verificar que se inició correctamente
If @error Then
    MsgBox(16, "Error", "No se pudo iniciar el servidor")
    Exit
EndIf

; Configurar bandeja del sistema
Opt("TrayMenuMode", 3)
Opt("TrayOnEventMode", 1)

; Configurar icono y tooltip
TraySetIcon(@ScriptDir & "\assets\icon.ico")
TraySetToolTip("Remote Control Server")

; Crear menu simple
$idAbrir = TrayCreateItem("Abrir en navegador")
TrayItemSetOnEvent(-1, "AbrirNavegador")

TrayCreateItem("")

$idSalir = TrayCreateItem("Salir")
TrayItemSetOnEvent(-1, "Salir")

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
Func AbrirNavegador()
    ShellExecute("http://localhost:3000")
EndFunc

Func Salir()
    If ProcessExists($hProcess) Then
        ProcessClose($hProcess)
    EndIf
    Exit
EndFunc
