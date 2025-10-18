import { Socket } from "socket.io-client";

interface TouchState {
  startX: number[];
  startY: number[];
  moved: boolean;
  clickPossible: boolean;
  twoFingerTouchStart: boolean;
  longPressTimer: NodeJS.Timeout | null;
  isDragging: boolean;
  isTwoFingerGesture: boolean;
  initialDistance: number;
  lastZoomDistance: number;
  lastZoomTime: number;
  hasZoomed: boolean;
  lastScrollTime: number;
  hasScrolled: boolean;
  lastTwoFingerGestureTime: number;
  rightClickTriggered: boolean;
  lastScrollEndTime: number;
  lastRightClickTime: number;
  potentialRightClick: boolean;
}

// Constants
const MOVE_THRESHOLD = 0.1;
const CLICK_DELAY = 50;
const TWO_FINGER_MOVE_THRESHOLD = 5;
const LONG_PRESS_DURATION = 500;
const ZOOM_THROTTLE_DELAY = 120;
const SCROLL_THROTTLE_DELAY = 100;
const TWO_FINGER_GESTURE_CLICK_DELAY = 200;
const THROTTLE_MS = 32;
const SCROLL_COOLDOWN_DELAY = 300; // Prevent clicks for 300ms after scroll ends
const RIGHT_CLICK_COOLDOWN_DELAY = 300; // Prevent left clicks for 300ms after right click

// State
const state: TouchState = {
  startX: [],
  startY: [],
  moved: false,
  clickPossible: false,
  twoFingerTouchStart: false,
  longPressTimer: null,
  isDragging: false,
  isTwoFingerGesture: false,
  initialDistance: 0,
  lastZoomDistance: 0,
  lastZoomTime: 0,
  hasZoomed: false,
  lastScrollTime: 0,
  hasScrolled: false,
  lastTwoFingerGestureTime: 0,
  rightClickTriggered: false,
  lastScrollEndTime: 0,
  lastRightClickTime: 0,
  potentialRightClick: false,
};

const trackpad = document.querySelector<HTMLElement>(".trackpad")!;

export const getDistance = (touch1: Touch, touch2: Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

// Handle two-finger scrolling - check if both fingers move in same direction
export const handleTwoFingerScroll = (
  e: TouchEvent,
  currentTime: number,
  socket: Socket
): void => {
  const finger1DeltaY =
    e.touches[0].clientY - trackpad.offsetTop - state.startY[0];
  const finger2DeltaY =
    e.touches[1].clientY - trackpad.offsetTop - state.startY[1];
  const scrollThreshold = 10;

  // Check if both fingers moved in the same direction with sufficient distance
  if (
    Math.abs(finger1DeltaY) > scrollThreshold &&
    Math.abs(finger2DeltaY) > scrollThreshold &&
    currentTime - state.lastScrollTime > SCROLL_THROTTLE_DELAY &&
    currentTime - state.lastZoomTime > 150
  ) {
    // Both fingers moving up (negative Y)
    if (finger1DeltaY < 0 && finger2DeltaY < 0) {
      const avgDelta = Math.abs((finger1DeltaY + finger2DeltaY) / 2);
      socket.emit("scroll", "up", avgDelta);
      state.hasScrolled = true;
      state.lastScrollTime = currentTime;

      // Update startY positions to allow continuous scrolling
      state.startY[0] = e.touches[0].clientY - trackpad.offsetTop;
      state.startY[1] = e.touches[1].clientY - trackpad.offsetTop;
    }
    // Both fingers moving down (positive Y)
    else if (finger1DeltaY > 0 && finger2DeltaY > 0) {
      const avgDelta = (finger1DeltaY + finger2DeltaY) / 2;
      socket.emit("scroll", "down", avgDelta);
      state.hasScrolled = true;
      state.lastScrollTime = currentTime;

      // Update startY positions to allow continuous scrolling
      state.startY[0] = e.touches[0].clientY - trackpad.offsetTop;
      state.startY[1] = e.touches[1].clientY - trackpad.offsetTop;
    }
  }
  // Check for scroll intent
  else if (
    Math.abs(finger1DeltaY) > 5 &&
    Math.abs(finger2DeltaY) > 5 &&
    currentTime - state.lastZoomTime > 150
  ) {
    // Both fingers moving in same direction indicates scroll intent
    if (
      (finger1DeltaY < 0 && finger2DeltaY < 0) ||
      (finger1DeltaY > 0 && finger2DeltaY > 0)
    ) {
      state.hasScrolled = true;
    }
  }
};

// Handle zoom gesture with continuous zooming (only if not scrolling or dragging)
export const handleTwoFingerZoom = (
  e: TouchEvent,
  currentTime: number,
  socket: Socket
): void => {
  if (!state.hasScrolled && !state.isDragging) {
    const currentDistance = getDistance(e.touches[0], e.touches[1]);

    if (
      state.initialDistance > 0 &&
      currentTime - state.lastZoomTime > ZOOM_THROTTLE_DELAY
    ) {
      // Add delay to zoom detection to let scrolling be detected first
      const zoomDelay = 150;
      if (currentTime - state.lastScrollTime > zoomDelay) {
        const distanceDiff = currentDistance - state.lastZoomDistance;
        const zoomThreshold = 5;

        if (Math.abs(distanceDiff) > zoomThreshold) {
          const zoomDirection = distanceDiff > 0 ? "in" : "out";
          // Scale down the magnitude to prevent excessive zooming
          const scaledMagnitude = Math.min(Math.abs(distanceDiff) / 5, 10);
          socket.emit("zoom", zoomDirection, scaledMagnitude);
          state.lastZoomDistance = currentDistance;
          state.lastZoomTime = currentTime;
          state.hasZoomed = true;
        } else if (Math.abs(distanceDiff) > 2) {
          state.hasZoomed = true;
          state.lastZoomDistance = currentDistance;
        }
      }
    }
  }
};

// Handle two-finger movement detection for right-click prevention
export const handleTwoFingerMovement = (e: TouchEvent): void => {
  const deltaX1 = Math.abs(
    e.touches[0].clientX - trackpad.offsetLeft - state.startX[0]
  );
  const deltaY1 = Math.abs(
    e.touches[0].clientY - trackpad.offsetTop - state.startY[0]
  );
  const deltaX2 = Math.abs(
    e.touches[1].clientX - trackpad.offsetLeft - state.startX[1]
  );
  const deltaY2 = Math.abs(
    e.touches[1].clientY - trackpad.offsetTop - state.startY[1]
  );

  if (
    deltaX1 > TWO_FINGER_MOVE_THRESHOLD ||
    deltaY1 > TWO_FINGER_MOVE_THRESHOLD ||
    deltaX2 > TWO_FINGER_MOVE_THRESHOLD ||
    deltaY2 > TWO_FINGER_MOVE_THRESHOLD
  ) {
    state.moved = true;
  }
};

// Handle single finger movement for mouse cursor
export const handleSingleFingerMovement = (
  e: TouchEvent,
  socket: Socket
): void => {
  const touch = e.touches[0];
  const currentX = touch.clientX - trackpad.offsetLeft;
  const currentY = touch.clientY - trackpad.offsetTop;

  const deltaX = +(currentX - state.startX[0]).toFixed(3);
  const deltaY = +(currentY - state.startY[0]).toFixed(3);

  // Filter out micro-movements and 0,0 noise
  const minimumMovement = 0.5;
  if (
    Math.abs(deltaX) < minimumMovement &&
    Math.abs(deltaY) < minimumMovement
  ) {
    return;
  }

  if (Math.abs(deltaX) > MOVE_THRESHOLD || Math.abs(deltaY) > MOVE_THRESHOLD) {
    state.moved = true;

    if (!state.isDragging && state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }

    state.clickPossible = false;
  }

  if (state.isDragging) {
    socket.emit("drag", deltaX, deltaY);
  } else {
    socket.emit("movement", deltaX, deltaY);
  }

  state.startX[0] = currentX;
  state.startY[0] = currentY;
};

// Create and setup the virtual keyboard input element
export const createKeyboardInput = (): HTMLInputElement => {
  const input = document.createElement("input");
  input.className = "keyboard-input";
  input.type = "text";
  input.style.position = "absolute";
  input.style.opacity = "0";
  // There is no Ñ de España otherwise :)
  input.setAttribute("lang", "es");
  input.setAttribute("accept-charset", "UTF-8");
  document.body.appendChild(input);
  return input;
};

// Handle character input from virtual keyboard
export const handleKeyboardInput = (event: Event, socket: Socket): void => {
  const target = event.target as HTMLInputElement;
  const currentValue = target.value;
  if (currentValue.length > 0) {
    const lastChar = currentValue.slice(-1);
    socket.emit("keyboard", { key: lastChar });
  }
  target.value = "";
};

// Handle special keys (Backspace, Enter) from virtual keyboard
export const handleKeyboardSpecialKeys = (
  event: KeyboardEvent,
  socket: Socket
): void => {
  const { key } = event;
  if (key === "Backspace") {
    socket.emit("keyboard", { key: key.toLowerCase() });
  }
  if (key === "Enter") {
    socket.emit("keyboard", { key: key.toLowerCase() });
  }
};

// Setup keyboard functionality
export const setupKeyboard = (
  input: HTMLInputElement,
  socket: Socket
): void => {
  input.addEventListener("input", (event) =>
    handleKeyboardInput(event, socket)
  );
  input.addEventListener("keydown", (event) =>
    handleKeyboardSpecialKeys(event, socket)
  );
};

export const handleTouchMove = (e: TouchEvent, socket: Socket): void => {
  // Handle multiple finger gestures
  if (e.touches.length > 1) {
    state.isTwoFingerGesture = true;

    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }

    if (state.twoFingerTouchStart && e.touches.length === 2) {
      const currentTime = Date.now();

      // Handle two-finger scrolling
      handleTwoFingerScroll(e, currentTime, socket);

      // Handle zoom gesture (only if not scrolling)
      handleTwoFingerZoom(e, currentTime, socket);

      // Handle movement detection for right-click prevention
      handleTwoFingerMovement(e);
    }

    return;
  }

  // Handle transition from two-finger to one-finger gesture
  if (state.isTwoFingerGesture && e.touches.length === 1) {
    state.isTwoFingerGesture = false;
    state.startX[0] = e.touches[0].clientX - trackpad.offsetLeft;
    state.startY[0] = e.touches[0].clientY - trackpad.offsetTop;
    return;
  }

  // Handle single finger movement
  handleSingleFingerMovement(e, socket);
};

export const handleTouchClick = (e: TouchEvent, socket: Socket): void => {
  socket.emit("click", "left");
};

export const handleTwoFingerTouchEnd = (
  e: TouchEvent,
  socket: Socket
): void => {
  if (
    state.twoFingerTouchStart &&
    e.touches.length === 0 &&
    !state.moved &&
    !state.hasZoomed &&
    !state.hasScrolled
  ) {
    socket.emit("click", "right");
    state.rightClickTriggered = true;
    state.lastRightClickTime = Date.now(); // Record when right-click happened
  }

  // Send scrollEnd event to stop any pending scroll operations
  if (state.hasScrolled) {
    socket.emit("scrollEnd");
    state.lastScrollEndTime = Date.now(); // Record when scroll ended
  }

  state.twoFingerTouchStart = false;
  state.isTwoFingerGesture = false;
  state.initialDistance = 0;
  state.lastZoomDistance = 0;
  state.hasZoomed = false;
  state.potentialRightClick = false;
  // Don't reset hasScrolled immediately - let the cooldown handle it
};

export const startDragMode = (socket: Socket): void => {
  state.isDragging = true;
  state.clickPossible = false; // Prevent click when drag mode starts
  if ("vibrate" in navigator) {
    navigator.vibrate(100);
  }
  socket.emit("dragStart");
};

export const endDragMode = (socket: Socket): void => {
  if (state.isDragging) {
    socket.emit("dragEnd");
    state.isDragging = false;
  }
};

export const throttle = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number
): ((...args: T) => void) => {
  let lastCall = 0;
  return function (...args: T): void {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      callback(...args);
    }
  };
};

export const throttledMove = throttle(handleTouchMove, THROTTLE_MS);

export const sendDimensions = (socket: Socket): void => {
  socket.emit("dimensions", {
    width: trackpad.clientWidth,
    height: trackpad.clientHeight,
  });
};

export const sendAction = (button: HTMLElement, socket: Socket): void => {
  const action = button.getAttribute("data-action");

  if (action === "shutdown" || action === "sleep") {
    if (
      !confirm(
        `¿Are you sure to ${
          action === "shutdown" ? "shutdown" : "sleep"
        } your PC?`
      )
    ) {
      return;
    }
  }

  socket.emit("media", action);

  button.classList.add("active");
  setTimeout(() => {
    button.classList.remove("active");
  }, 200);
};

export const handleTouchStart = (e: TouchEvent, socket: Socket): void => {
  e.preventDefault();
  socket?.emit("testScrollDebug");

  const keyboardInput =
    document.querySelector<HTMLInputElement>(".keyboard-input");
  if (keyboardInput && document.activeElement === keyboardInput) {
    keyboardInput.blur();
  }

  state.startX = [];
  state.startY = [];
  state.moved = false;
  state.clickPossible = false;

  for (let i = 0; i < e.touches.length; i++) {
    state.startX.push(e.touches[i].clientX - trackpad.offsetLeft);
    state.startY.push(e.touches[i].clientY - trackpad.offsetTop);
  }

  if (e.touches.length === 2) {
    state.twoFingerTouchStart = true;
    state.isTwoFingerGesture = true;
    state.potentialRightClick = true; // Mark this as a potential right-click
    state.initialDistance = getDistance(e.touches[0], e.touches[1]);
    state.lastZoomDistance = state.initialDistance;
    state.hasZoomed = false;
    state.hasScrolled = false;

    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
  } else if (e.touches.length === 1) {
    // Don't set clickPossible if we just had a two-finger gesture
    const timeSinceRightClick = Date.now() - state.lastRightClickTime;
    if (timeSinceRightClick > RIGHT_CLICK_COOLDOWN_DELAY) {
      setTimeout(() => {
        state.clickPossible = true;
      }, CLICK_DELAY);
    }

    if (!state.isTwoFingerGesture) {
      state.longPressTimer = setTimeout(() => {
        if (!state.moved) {
          startDragMode(socket);
        }
        state.longPressTimer = null;
      }, LONG_PRESS_DURATION);
    }
  }
};

export const handleTouchEnd = (e: TouchEvent, socket: Socket): void => {
  e.preventDefault();

  if (state.longPressTimer) {
    clearTimeout(state.longPressTimer);
    state.longPressTimer = null;
  }

  // Check if we're within the scroll cooldown period
  const isWithinScrollCooldown =
    Date.now() - state.lastScrollEndTime < SCROLL_COOLDOWN_DELAY;

  // Check if we're within the right-click cooldown period
  const isWithinRightClickCooldown =
    Date.now() - state.lastRightClickTime < RIGHT_CLICK_COOLDOWN_DELAY;

  if (
    !state.moved &&
    state.clickPossible &&
    e.touches.length === 0 &&
    !state.isTwoFingerGesture &&
    !state.rightClickTriggered &&
    !state.hasZoomed &&
    !state.hasScrolled && // Check current scroll state
    !isWithinScrollCooldown && // Check cooldown period
    !isWithinRightClickCooldown && // Check right-click cooldown
    !state.potentialRightClick && // Check if this might be part of a right-click
    !state.isDragging && // Don't click if we were in drag mode
    Date.now() - state.lastTwoFingerGestureTime > TWO_FINGER_GESTURE_CLICK_DELAY
  ) {
    handleTouchClick(e, socket);
  }

  if (state.twoFingerTouchStart && e.touches.length === 0) {
    handleTwoFingerTouchEnd(e, socket);
    state.lastTwoFingerGestureTime = Date.now();
  }

  if (e.touches.length === 0) {
    // Send scrollEnd event to stop any pending scroll operations
    if (state.hasScrolled) {
      socket.emit("scrollEnd");
      state.lastScrollEndTime = Date.now(); // Update when scroll ends
    }

    endDragMode(socket);
    state.isTwoFingerGesture = false;
    state.initialDistance = 0;
    state.lastZoomDistance = 0;
    state.hasZoomed = false;

    // Reset hasScrolled after a delay to prevent ghost clicks
    if (state.hasScrolled) {
      setTimeout(() => {
        state.hasScrolled = false;
      }, SCROLL_COOLDOWN_DELAY);
    } else {
      state.hasScrolled = false;
    }

    state.rightClickTriggered = false;
    state.potentialRightClick = false;
  }

  state.moved = false;
};

export * as EVENTS from "./events";
