import { dlopen, FFIType, ptr } from "bun:ffi";

// Load user32.dll (included in Windows)
const user32 = dlopen("user32.dll", {
  SetCursorPos: {
    args: [FFIType.i32, FFIType.i32],
    returns: FFIType.bool,
  },
  GetCursorPos: {
    args: [FFIType.ptr],
    returns: FFIType.bool,
  },
  mouse_event: {
    args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr],
    returns: FFIType.void,
  },
  keybd_event: {
    args: [FFIType.u8, FFIType.u8, FFIType.u32, FFIType.ptr],
    returns: FFIType.void,
  },
  SendInput: {
    args: [FFIType.u32, FFIType.ptr, FFIType.i32],
    returns: FFIType.u32,
  },
  GetSystemMetrics: {
    args: [FFIType.i32],
    returns: FFIType.i32,
  },
  VkKeyScanW: {
    args: [FFIType.u16],
    returns: FFIType.i16,
  },
});

// Constants for mouse_event
const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0008;
const MOUSEEVENTF_RIGHTUP = 0x0010;
const MOUSEEVENTF_MIDDLEDOWN = 0x0020;
const MOUSEEVENTF_MIDDLEUP = 0x0040;
const MOUSEEVENTF_WHEEL = 0x0800;

// Constants for keybd_event
const KEYEVENTF_KEYUP = 0x0002;
const VK_SHIFT = 0x10;
const VK_CONTROL = 0x11;
const VK_MENU = 0x12; // ALT

// Constants for SendInput
const INPUT_KEYBOARD = 1;
const KEYEVENTF_UNICODE = 0x0004;

// Common Virtual Key Codes
const VK = {
  LBUTTON: 0x01,
  RBUTTON: 0x02,
  BACK: 0x08,
  TAB: 0x09,
  RETURN: 0x0d,
  SHIFT: 0x10,
  CONTROL: 0x11,
  MENU: 0x12,
  ESCAPE: 0x1b,
  SPACE: 0x20,
  LEFT: 0x25,
  UP: 0x26,
  RIGHT: 0x27,
  DOWN: 0x28,
  DELETE: 0x2e,
  OEM_1: 0xba,
  OEM_PLUS: 0xbb,
  OEM_COMMA: 0xbc,
  OEM_MINUS: 0xbd,
  OEM_PERIOD: 0xbe,
  OEM_2: 0xbf,
  OEM_3: 0xc0,
  OEM_4: 0xdb,
  OEM_5: 0xdc,
  OEM_6: 0xdd,
  OEM_7: 0xde,
  C: 0x43,
  D: 0x44,
  E: 0x45,
  F: 0x46,
  G: 0x47,
  H: 0x48,
  I: 0x49,
  J: 0x4a,
  K: 0x4b,
  L: 0x4c,
  M: 0x4d,
  N: 0x4e,
  O: 0x4f,
  P: 0x50,
  Q: 0x51,
  R: 0x52,
  S: 0x53,
  T: 0x54,
  U: 0x55,
  V: 0x56,
  W: 0x57,
  X: 0x58,
  Y: 0x59,
  Z: 0x5a,
  Ñ: 0xf1,
};

export type VK = keyof typeof VK;

export const mouse = {
  moveTo(x: number, y: number): void {
    user32.symbols.SetCursorPos(x, y);
  },

  move(dx: number, dy: number): void {
    const pos = this.getPosition();
    this.moveTo(pos.x + dx, pos.y + dy);
  },

  getPosition(): { x: number; y: number } {
    const point = new Int32Array(2);
    user32.symbols.GetCursorPos(new Uint8Array(point.buffer));
    return { x: point[0], y: point[1] };
  },

  leftClick(): void {
    user32.symbols.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, null);
    user32.symbols.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, null);
  },

  rightClick(): void {
    user32.symbols.mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, null);
    user32.symbols.mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, null);
  },

  middleClick(): void {
    user32.symbols.mouse_event(MOUSEEVENTF_MIDDLEDOWN, 0, 0, 0, null);
    user32.symbols.mouse_event(MOUSEEVENTF_MIDDLEUP, 0, 0, 0, null);
  },

  doubleClick(): void {
    this.leftClick();
    this.leftClick();
  },

  scroll(delta: number): void {
    const wheelDelta = delta * 120;
    user32.symbols.mouse_event(MOUSEEVENTF_WHEEL, 0, 0, wheelDelta, null);
  },

  scrollUp(amount: number = 1): void {
    this.scroll(amount);
  },

  scrollDown(amount: number = 1): void {
    this.scroll(-amount);
  },

  mouseDown(button: "left" | "right" | "middle" = "left"): void {
    const flags = {
      left: MOUSEEVENTF_LEFTDOWN,
      right: MOUSEEVENTF_RIGHTDOWN,
      middle: MOUSEEVENTF_MIDDLEDOWN,
    };
    user32.symbols.mouse_event(flags[button], 0, 0, 0, null);
  },

  mouseUp(button: "left" | "right" | "middle" = "left"): void {
    const flags = {
      left: MOUSEEVENTF_LEFTUP,
      right: MOUSEEVENTF_RIGHTUP,
      middle: MOUSEEVENTF_MIDDLEUP,
    };
    user32.symbols.mouse_event(flags[button], 0, 0, 0, null);
  },

  mouseToggle(
    state: "down" | "up",
    button: "left" | "right" | "middle" = "left"
  ): void {
    if (state === "down") {
      this.mouseDown(button);
    } else {
      this.mouseUp(button);
    }
  },
};

// INPUT structure for SendInput
function createKeyboardInput(
  wVk: number,
  wScan: number,
  dwFlags: number
): Uint8Array {
  const input = new Uint8Array(28);
  const view = new DataView(input.buffer);
  view.setUint32(0, INPUT_KEYBOARD, true);
  view.setUint16(4, wVk, true);
  view.setUint16(6, wScan, true);
  view.setUint32(8, dwFlags, true);
  view.setUint32(12, 0, true);
  view.setBigUint64(16, BigInt(0), true);
  return input;
}

function sendUnicodeChar(char: string): void {
  const charCode = char.charCodeAt(0);
  const inputDown = createKeyboardInput(0, charCode, KEYEVENTF_UNICODE);
  const inputUp = createKeyboardInput(
    0,
    charCode,
    KEYEVENTF_UNICODE | KEYEVENTF_KEYUP
  );
  const inputs = new Uint8Array(56);
  inputs.set(inputDown, 0);
  inputs.set(inputUp, 28);
  user32.symbols.SendInput(2, ptr(inputs), 28);
  Bun.sleepSync(20);
}

// Fallback mapping for dead keys (mainly accents)
// This map is used when VkKeyScanW does not handle a character correctly
const fallbackCharMap: Record<string, () => void> = {
  // Acute accents (dead key ´)
  á: () => {
    tapKey(0xde, false);
    tapKey(0x41, false);
  },
  é: () => {
    tapKey(0xde, false);
    tapKey(0x45, false);
  },
  í: () => {
    tapKey(0xde, false);
    tapKey(0x49, false);
  },
  ó: () => {
    tapKey(0xde, false);
    tapKey(0x4f, false);
  },
  ú: () => {
    tapKey(0xde, false);
    tapKey(0x55, false);
  },
  Á: () => {
    tapKey(0xde, false);
    tapKey(0x41, true);
  },
  É: () => {
    tapKey(0xde, false);
    tapKey(0x45, true);
  },
  Í: () => {
    tapKey(0xde, false);
    tapKey(0x49, true);
  },
  Ó: () => {
    tapKey(0xde, false);
    tapKey(0x4f, true);
  },
  Ú: () => {
    tapKey(0xde, false);
    tapKey(0x55, true);
  },

  // Diaeresis (dead key ¨ = Shift + ´)
  ü: () => {
    tapKey(0xde, true);
    tapKey(0x55, false);
  },
  Ü: () => {
    tapKey(0xde, true);
    tapKey(0x55, true);
  },
};

function tapKey(vk: number, shift: boolean): void {
  if (shift) {
    user32.symbols.keybd_event(VK_SHIFT, 0, 0, null);
    Bun.sleepSync(5);
  }
  user32.symbols.keybd_event(vk, 0, 0, null);
  Bun.sleepSync(5);
  user32.symbols.keybd_event(vk, 0, KEYEVENTF_KEYUP, null);
  if (shift) {
    Bun.sleepSync(5);
    user32.symbols.keybd_event(VK_SHIFT, 0, KEYEVENTF_KEYUP, null);
  }
  Bun.sleepSync(15);
}

function tapKeyAltGr(vk: number): void {
  // AltGr = Control + Right Alt
  user32.symbols.keybd_event(VK_CONTROL, 0, 0, null);
  user32.symbols.keybd_event(VK_MENU, 0, 0, null);
  Bun.sleepSync(10);
  user32.symbols.keybd_event(vk, 0, 0, null);
  Bun.sleepSync(5);
  user32.symbols.keybd_event(vk, 0, KEYEVENTF_KEYUP, null);
  Bun.sleepSync(10);
  user32.symbols.keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, null);
  user32.symbols.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, null);
  Bun.sleepSync(15);
}

export const keyboard = {
  tap(key: keyof typeof VK): void {
    const vk = VK[key];
    user32.symbols.keybd_event(vk, 0, 0, null);
    user32.symbols.keybd_event(vk, 0, KEYEVENTF_KEYUP, null);
  },

  keyDown(key: keyof typeof VK): void {
    const vk = VK[key];
    user32.symbols.keybd_event(vk, 0, 0, null);
  },

  keyUp(key: keyof typeof VK): void {
    const vk = VK[key];
    user32.symbols.keybd_event(vk, 0, KEYEVENTF_KEYUP, null);
  },

  typeChar(char: string): void {
    const charCode = char.charCodeAt(0);

    // STEP 1: Try using VkKeyScanW (works for any keyboard layout)
    const result = user32.symbols.VkKeyScanW(charCode);

    if (result !== -1) {
      const vk = result & 0xff;
      const modifiers = (result >> 8) & 0xff;

      const needsShift = (modifiers & 1) !== 0;
      const needsCtrl = (modifiers & 2) !== 0;
      const needsAlt = (modifiers & 4) !== 0;

      // If it requires Ctrl+Alt (AltGr), use tapKeyAltGr
      if (needsCtrl && needsAlt) {
        tapKeyAltGr(vk);
        return;
      }

      // If it only requires Shift or nothing, use normal tapKey
      if (!needsCtrl && !needsAlt) {
        tapKey(vk, needsShift);
        return;
      }
    }

    // STEP 2: If VkKeyScanW failed, use the fallback map
    const fallbackHandler = fallbackCharMap[char];
    if (fallbackHandler) {
      fallbackHandler();
      return;
    }

    // STEP 3: As a last resort, try Unicode (rarely works well)
    console.warn(`Using Unicode for: '${char}' (may not work)`);
    sendUnicodeChar(char);
  },

  type(text: string): void {
    for (const char of text) {
      this.typeChar(char);
    }
  },

  shortcut(...keys: (keyof typeof VK)[]): void {
    for (const key of keys) {
      this.keyDown(key);
    }
    Bun.sleepSync(50);
    for (let i = keys.length - 1; i >= 0; i--) {
      this.keyUp(keys[i]);
    }
  },

  zoomIn(): void {
    this.keyDown("CONTROL");
    this.tap("OEM_PLUS");
    this.keyUp("CONTROL");
  },

  zoomOut(): void {
    this.keyDown("CONTROL");
    this.tap("OEM_MINUS");
    this.keyUp("CONTROL");
  },
};

export const screen = {
  getSize(): { width: number; height: number } {
    const SM_CXSCREEN = 0;
    const SM_CYSCREEN = 1;
    return {
      width: user32.symbols.GetSystemMetrics(SM_CXSCREEN),
      height: user32.symbols.GetSystemMetrics(SM_CYSCREEN),
    };
  },
};
