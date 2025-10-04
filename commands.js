export const systemCommands = {
  volumeUp: {
    win32:
      'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]175)"',
    darwin:
      'osascript -e "set volume output volume (output volume of (get volume settings) + 10)"',
    linux: "amixer -q sset Master 5%+",
    successMessage: "[UTILITIES] Volume increased",
    errorMessage: "Error increasing volume",
  },
  volumeDown: {
    win32:
      'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]174)"',
    darwin:
      'osascript -e "set volume output volume (output volume of (get volume settings) - 10)"',
    linux: "amixer -q sset Master 5%-",
    successMessage: "[MEDIA] Volume decreased",
    errorMessage: "Error decreasing volume",
  },
  mute: {
    win32:
      'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]173)"',
    darwin: 'osascript -e "set volume with output muted"',
    linux: "amixer -q sset Master toggle",
    successMessage: "[MEDIA] Audio toggled mute/unmute",
    errorMessage: "Error toggling mute",
  },
  playPause: {
    win32:
      'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]179)"',
    darwin:
      'osascript -e "tell application \\"System Events\\" to key code 49"',
    linux: "xdotool key XF86AudioPlay",
    successMessage: "[MEDIA] Media play/pause toggled",
    errorMessage: "Error toggling media playback",
  },
  nextTrack: {
    win32:
      'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]176)"',
    darwin:
      'osascript -e "tell application \\"System Events\\" to key code 124 using {command down}"',
    linux: "xdotool key XF86AudioNext",
    successMessage: "[MEDIA] Skipped to next track",
    errorMessage: "Error skipping to next track",
  },
  prevTrack: {
    win32:
      'powershell -c "(New-Object -COM WScript.Shell).SendKeys([char]177)"',
    darwin:
      'osascript -e "tell application \\"System Events\\" to key code 123 using {command down}"',
    linux: "xdotool key XF86AudioPrev",
    successMessage: "[MEDIA] Skipped to previous track",
    errorMessage: "Error skipping to previous track",
  },
  lock: {
    win32: "rundll32.exe user32.dll,LockWorkStation",
    darwin: "pmset displaysleepnow",
    linux: "xdg-screensaver lock",
    successMessage: "[MEDIA] Computer locked",
    errorMessage: "Error locking computer",
  },
  sleep: {
    win32: "rundll32.exe powrprof.dll,SetSuspendState 0,1,0",
    darwin: "pmset sleepnow",
    linux: "systemctl suspend",
    successMessage: "[SYSTEM] Computer going to sleep 😴",
    errorMessage: "Error putting computer to sleep",
  },
  shutdown: {
    win32: 'shutdown /s /t 10 /c "Shutting down from remote control."',
    darwin: 'osascript -e "tell app \\"System Events\\" to shut down"',
    linux: "shutdown -h now",
    successMessage: "[SYSTEM] Computer shutting down...",
    errorMessage: "Error shutting down computer",
  },
  taskManager: {
    win32: "1",
    darwin: "",
    linux: "",
    successMessage: "[SYSTEM] Task Manager opened",
    errorMessage: "Error opening Task Manager",
  },
  copy: {
    win32: "1",
    darwin: "1",
    linux: "1",
    successMessage: "[UTILITIES] Text copied to clipboard",
    errorMessage: "Error copying to clipboard",
  },
  paste: {
    win32: "1",
    darwin: "1",
    linux: "1",
    successMessage: "[UTILITIES] Text pasted from clipboard",
    errorMessage: "Error pasting from clipboard",
  },
  undo: {
    win32: "1",
    darwin: "1",
    linux: "1",
    successMessage: "[UTILITIES] Action undone",
    errorMessage: "Error undoing action",
  },
  redo: {
    win32: "1",
    darwin: "1",
    linux: "1",
    successMessage: "[UTILITIES] Action redone",
    errorMessage: "Error redoing action",
  },
};
