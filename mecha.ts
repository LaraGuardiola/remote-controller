import { dlopen, FFIType } from "bun:ffi";

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
});

// Constants for mouse_event
const MOUSEEVENTF_MOVE = 0x0001;
const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0008;
const MOUSEEVENTF_RIGHTUP = 0x0010;
const MOUSEEVENTF_MIDDLEDOWN = 0x0020;
const MOUSEEVENTF_MIDDLEUP = 0x0040;
const MOUSEEVENTF_WHEEL = 0x0800;
const MOUSEEVENTF_ABSOLUTE = 0x8000;

// Constants for keybd_event
const KEYEVENTF_KEYUP = 0x0002;

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
};

export type VK = keyof typeof VK;

// Mapeo de caracteres a teclas con o sin Shift
const charToVK: Record<string, { vk: number; shift: boolean }> = {
  a: { vk: 0x41, shift: false },
  b: { vk: 0x42, shift: false },
  c: { vk: 0x43, shift: false },
  d: { vk: 0x44, shift: false },
  e: { vk: 0x45, shift: false },
  f: { vk: 0x46, shift: false },
  g: { vk: 0x47, shift: false },
  h: { vk: 0x48, shift: false },
  i: { vk: 0x49, shift: false },
  j: { vk: 0x4a, shift: false },
  k: { vk: 0x4b, shift: false },
  l: { vk: 0x4c, shift: false },
  m: { vk: 0x4d, shift: false },
  n: { vk: 0x4e, shift: false },
  o: { vk: 0x4f, shift: false },
  p: { vk: 0x50, shift: false },
  q: { vk: 0x51, shift: false },
  r: { vk: 0x52, shift: false },
  s: { vk: 0x53, shift: false },
  t: { vk: 0x54, shift: false },
  u: { vk: 0x55, shift: false },
  v: { vk: 0x56, shift: false },
  w: { vk: 0x57, shift: false },
  x: { vk: 0x58, shift: false },
  y: { vk: 0x59, shift: false },
  z: { vk: 0x5a, shift: false },
  A: { vk: 0x41, shift: true },
  B: { vk: 0x42, shift: true },
  C: { vk: 0x43, shift: true },
  D: { vk: 0x44, shift: true },
  E: { vk: 0x45, shift: true },
  F: { vk: 0x46, shift: true },
  G: { vk: 0x47, shift: true },
  H: { vk: 0x48, shift: true },
  I: { vk: 0x49, shift: true },
  J: { vk: 0x4a, shift: true },
  K: { vk: 0x4b, shift: true },
  L: { vk: 0x4c, shift: true },
  M: { vk: 0x4d, shift: true },
  N: { vk: 0x4e, shift: true },
  O: { vk: 0x4f, shift: true },
  P: { vk: 0x50, shift: true },
  Q: { vk: 0x51, shift: true },
  R: { vk: 0x52, shift: true },
  S: { vk: 0x53, shift: true },
  T: { vk: 0x54, shift: true },
  U: { vk: 0x55, shift: true },
  V: { vk: 0x56, shift: true },
  W: { vk: 0x57, shift: true },
  X: { vk: 0x58, shift: true },
  Y: { vk: 0x59, shift: true },
  Z: { vk: 0x5a, shift: true },
  "0": { vk: 0x30, shift: false },
  "1": { vk: 0x31, shift: false },
  "2": { vk: 0x32, shift: false },
  "3": { vk: 0x33, shift: false },
  "4": { vk: 0x34, shift: false },
  "5": { vk: 0x35, shift: false },
  "6": { vk: 0x36, shift: false },
  "7": { vk: 0x37, shift: false },
  "8": { vk: 0x38, shift: false },
  "9": { vk: 0x39, shift: false },
  " ": { vk: 0x20, shift: false },
  ".": { vk: 0xbe, shift: false },
  ",": { vk: 0xbc, shift: false },
  ";": { vk: 0xba, shift: false },
  ":": { vk: 0xba, shift: true },
  "=": { vk: 0xbb, shift: false },
  "+": { vk: 0xbb, shift: true },
  "-": { vk: 0xbd, shift: false },
  _: { vk: 0xbd, shift: true },
  "/": { vk: 0xbf, shift: false },
  "?": { vk: 0xbf, shift: true },
  "`": { vk: 0xc0, shift: false },
  "~": { vk: 0xc0, shift: true },
  "[": { vk: 0xdb, shift: false },
  "{": { vk: 0xdb, shift: true },
  "\\": { vk: 0xdc, shift: false },
  "|": { vk: 0xdc, shift: true },
  "]": { vk: 0xdd, shift: false },
  "}": { vk: 0xdd, shift: true },
  "'": { vk: 0xde, shift: false },
  '"': { vk: 0xde, shift: true },
  "<": { vk: 0xbc, shift: true },
  ">": { vk: 0xbe, shift: true },
  "!": { vk: 0x31, shift: true },
  "@": { vk: 0x32, shift: true },
  "#": { vk: 0x33, shift: true },
  $: { vk: 0x34, shift: true },
  "%": { vk: 0x35, shift: true },
  "^": { vk: 0x36, shift: true },
  "&": { vk: 0x37, shift: true },
  "*": { vk: 0x38, shift: true },
  "(": { vk: 0x39, shift: true },
  ")": { vk: 0x30, shift: true },
};

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
    const mapping = charToVK[char];

    // Si el carácter está mapeado, usar keybd_event
    if (mapping) {
      if (mapping.shift) {
        user32.symbols.keybd_event(0x10, 0, 0, null);
        Bun.sleepSync(5);
      }
      user32.symbols.keybd_event(mapping.vk, 0, 0, null);
      Bun.sleepSync(5);
      user32.symbols.keybd_event(mapping.vk, 0, KEYEVENTF_KEYUP, null);
      if (mapping.shift) {
        Bun.sleepSync(5);
        user32.symbols.keybd_event(0x10, 0, KEYEVENTF_KEYUP, null);
      }
      Bun.sleepSync(10);
    } else {
      // Para caracteres no mapeados (ñ, acentos, €, etc.)
      // Intentar con SendInput Unicode (aunque sabemos que no funciona bien)
      console.warn(
        `Carácter no soportado directamente: ${char} (código: ${char.charCodeAt(
          0
        )})`
      );

      // Como SendInput no funciona, simplemente lo ignoramos o podríamos
      // intentar usar el portapapeles como workaround (más complejo)
      Bun.sleepSync(10);
    }
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
