import robot from 'robotjs';

export const systemCommands = {
    volumeUp: {
        win32: 'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]175)"',
        darwin: 'osascript -e "set volume output volume (output volume of (get volume settings) + 10)"',
        linux: 'amixer -q sset Master 5%+'
    },
    volumeDown: {
        win32: 'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]174)"',
        darwin: 'osascript -e "set volume output volume (output volume of (get volume settings) - 10)"',
        linux: 'amixer -q sset Master 5%-'
    },
    mute: {
        win32: 'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]173)"',
        darwin: 'osascript -e "set volume with output muted"',
        linux: 'amixer -q sset Master toggle'
    },
    playPause: {
        win32: 'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]179)"',
        darwin: 'osascript -e "tell application \\"System Events\\" to key code 49"',
        linux: 'xdotool key XF86AudioPlay'
    },
    nextTrack: {
        win32: 'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]176)"',
        darwin: 'osascript -e "tell application \\"System Events\\" to key code 124 using {command down}"',
        linux: 'xdotool key XF86AudioNext'
    },
    prevTrack: {
        win32: 'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]177)"',
        darwin: 'osascript -e "tell application \\"System Events\\" to key code 123 using {command down}"',
        linux: 'xdotool key XF86AudioPrev'
    },
    lock: {
        win32: 'rundll32.exe user32.dll,LockWorkStation',
        darwin: 'pmset displaysleepnow',
        linux: 'xdg-screensaver lock'
    },
    sleep: {
        win32: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0',
        darwin: 'pmset sleepnow',
        linux: 'systemctl suspend'
    },
    shutdown: {
        win32: 'shutdown /s /t 10 /c "Apagado remoto iniciado desde Unified Remote"',
        darwin: 'osascript -e "tell app \\"System Events\\" to shut down"',
        linux: 'shutdown -h now'
    },
    taskManager: {
        win32: "",
        darwin: "",
        linux: ""
    },
    copy: {
        win32: "",
        darwin: "",
        linux: ""
    },
    paste: {
        win32: "",
        darwin: "",
        linux: ""
    },
    undo: {
        win32: "",
        darwin: "",
        linux: ""
    },
    redo: {
        win32: "",
        darwin: "",
        linux: ""
    }
};