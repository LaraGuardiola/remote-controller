import { io } from "socket.io-client";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const ip = prompt("Enter your IP digits:");

let localAddress = `http://192.168.1.${ip}:3000`;

const socket = io(localAddress, {
  transports: ["polling", "websocket"],
  timeout: 10000,
  forceNew: true,
  upgrade: true,
  rememberUpgrade: false,
});
const trackpad = document.querySelector(".trackpad");

let startX = [];
let startY = [];
let moved = false;
const moveThreshold = 0.1;
let clickPossible = false;
const clickDelay = 50;
let twoFingerTouchStart = false;
const twoFingerMoveThreshold = 5;
let longPressTimer = null;
const longPressDuration = 500;
let isDragging = false;
let isTwoFingerGesture = false;
let initialDistance = 0;
let lastZoomDistance = 0;
let lastZoomTime = 0;
let hasZoomed = false;
let lastScrollTime = 0;
let hasScrolled = false;
const zoomThrottleDelay = 100;
const scrollThrottleDelay = 80;
let lastTwoFingerGestureTime = 0;
const twoFingerGestureClickDelay = 200;

const sendDimensions = () => {
  socket.emit("dimensions", {
    width: trackpad.clientWidth,
    height: trackpad.clientHeight,
  });
};

const getDistance = (touch1, touch2) => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

// Handle two-finger scrolling - check if both fingers move in same direction
const handleTwoFingerScroll = (e, currentTime) => {
  const finger1DeltaY = e.touches[0].clientY - trackpad.offsetTop - startY[0];
  const finger2DeltaY = e.touches[1].clientY - trackpad.offsetTop - startY[1];
  const scrollThreshold = 15;

  // Check if both fingers moved in the same direction with sufficient distance
  if (
    Math.abs(finger1DeltaY) > scrollThreshold &&
    Math.abs(finger2DeltaY) > scrollThreshold &&
    currentTime - lastScrollTime > scrollThrottleDelay &&
    currentTime - lastZoomTime > 150
  ) {
    // Both fingers moving up (negative Y)
    if (finger1DeltaY < 0 && finger2DeltaY < 0) {
      const avgDelta = Math.abs((finger1DeltaY + finger2DeltaY) / 2);

      socket.emit("scroll", "up", avgDelta);
      hasScrolled = true;
      lastScrollTime = currentTime;

      // Update startY positions to allow continuous scrolling
      startY[0] = e.touches[0].clientY - trackpad.offsetTop;
      startY[1] = e.touches[1].clientY - trackpad.offsetTop;
    }
    // Both fingers moving down (positive Y)
    else if (finger1DeltaY > 0 && finger2DeltaY > 0) {
      const avgDelta = (finger1DeltaY + finger2DeltaY) / 2;

      socket.emit("scroll", "down", avgDelta);
      hasScrolled = true;
      lastScrollTime = currentTime;

      // Update startY positions to allow continuous scrolling
      startY[0] = e.touches[0].clientY - trackpad.offsetTop;
      startY[1] = e.touches[1].clientY - trackpad.offsetTop;
    }
  }
};

// Handle zoom gesture with continuous zooming (only if not scrolling or dragging)
const handleTwoFingerZoom = (e, currentTime) => {
  if (!hasScrolled && !isDragging) {
    const currentDistance = getDistance(e.touches[0], e.touches[1]);

    if (initialDistance > 0 && currentTime - lastZoomTime > zoomThrottleDelay) {
      // Add delay to zoom detection to let scrolling be detected first
      const zoomDelay = 150; // Give scroll detection priority for 150ms
      if (currentTime - lastScrollTime > zoomDelay) {
        const distanceDiff = currentDistance - lastZoomDistance;
        const zoomThreshold = 10;

        if (Math.abs(distanceDiff) > zoomThreshold) {
          const zoomDirection = distanceDiff > 0 ? "in" : "out";
          // Scale down the magnitude to prevent excessive zooming
          const scaledMagnitude = Math.min(Math.abs(distanceDiff) / 5, 10);
          socket.emit("zoom", zoomDirection, scaledMagnitude);
          lastZoomDistance = currentDistance;
          lastZoomTime = currentTime;
          hasZoomed = true;
        }
      }
    }
  }
};

// Handle two-finger movement detection for right-click prevention
const handleTwoFingerMovement = (e) => {
  const deltaX1 = Math.abs(
    e.touches[0].clientX - trackpad.offsetLeft - startX[0],
  );
  const deltaY1 = Math.abs(
    e.touches[0].clientY - trackpad.offsetTop - startY[0],
  );
  const deltaX2 = Math.abs(
    e.touches[1].clientX - trackpad.offsetLeft - startX[1],
  );
  const deltaY2 = Math.abs(
    e.touches[1].clientY - trackpad.offsetTop - startY[1],
  );

  if (
    deltaX1 > twoFingerMoveThreshold ||
    deltaY1 > twoFingerMoveThreshold ||
    deltaX2 > twoFingerMoveThreshold ||
    deltaY2 > twoFingerMoveThreshold
  ) {
    moved = true;
  }
};

// Handle single finger movement for mouse cursor
const handleSingleFingerMovement = (e) => {
  const touch = e.touches[0];
  const currentX = touch.clientX - trackpad.offsetLeft;
  const currentY = touch.clientY - trackpad.offsetTop;

  const deltaX = +(currentX - startX[0]).toFixed(3);
  const deltaY = +(currentY - startY[0]).toFixed(3);

  // Filter out micro-movements and 0,0 noise
  const minimumMovement = 0.5;
  if (
    Math.abs(deltaX) < minimumMovement &&
    Math.abs(deltaY) < minimumMovement
  ) {
    return;
  }

  if (Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold) {
    moved = true;

    if (!isDragging && longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    clickPossible = false;
  }

  if (isDragging) {
    socket.emit("drag", deltaX, deltaY);
  } else {
    socket.emit("movement", deltaX, deltaY);
  }

  startX[0] = currentX;
  startY[0] = currentY;
};

// Create and setup the virtual keyboard input element
const createKeyboardInput = () => {
  let input = document.createElement("input");
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
const handleKeyboardInput = (event) => {
  const currentValue = event.target.value;
  if (currentValue.length > 0) {
    const lastChar = currentValue.slice(-1);
    socket.emit("keyboard", { key: lastChar });
  }
  event.target.value = "";
};

// Handle special keys (Backspace, Enter) from virtual keyboard
const handleKeyboardSpecialKeys = (event) => {
  const { key } = event;
  if (key === "Backspace") {
    socket.emit("keyboard", { key: key.toLowerCase() });
  }
  if (key === "Enter") {
    socket.emit("keyboard", { key: key.toLowerCase() });
  }
};

// Setup keyboard functionality
const setupKeyboard = (input) => {
  input.addEventListener("input", handleKeyboardInput);
  input.addEventListener("keydown", handleKeyboardSpecialKeys);
};

socket.on("connect", async () => {
  console.log(socket.id);

  if (Capacitor.isNativePlatform()) {
    try {
      const permResult = await LocalNotifications.requestPermissions();
      if (permResult.display === "granted") {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: "Connection established",
              body: `Connected to ${localAddress}`,
              id: 1,
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error with notifications:", error);
    }
  }

  sendDimensions();
});

const handleTouchMove = (e) => {
  // Handle multiple finger gestures
  if (e.touches.length > 1) {
    isTwoFingerGesture = true;

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    if (twoFingerTouchStart && e.touches.length === 2) {
      const currentTime = Date.now();

      // Handle two-finger scrolling
      handleTwoFingerScroll(e, currentTime);

      // Handle zoom gesture (only if not scrolling)
      handleTwoFingerZoom(e, currentTime);

      // Handle movement detection for right-click prevention
      handleTwoFingerMovement(e);
    }

    return;
  }

  // Handle transition from two-finger to one-finger gesture
  if (isTwoFingerGesture && e.touches.length === 1) {
    isTwoFingerGesture = false;
    startX[0] = e.touches[0].clientX - trackpad.offsetLeft;
    startY[0] = e.touches[0].clientY - trackpad.offsetTop;
    return;
  }

  // Handle single finger movement
  handleSingleFingerMovement(e);
};

const handleTouchClick = (e) => {
  socket.emit("click", "left");
};

const handleTwoFingerTouchEnd = (e) => {
  if (
    twoFingerTouchStart &&
    e.touches.length === 0 &&
    !moved &&
    !hasZoomed &&
    !hasScrolled
  ) {
    socket.emit("click", "right");
  }

  // Send scrollEnd event to stop any pending scroll operations
  if (hasScrolled) {
    socket.emit("scrollEnd");
  }

  twoFingerTouchStart = false;
  isTwoFingerGesture = false;
  initialDistance = 0;
  lastZoomDistance = 0;
  hasZoomed = false;
  hasScrolled = false;
};

const startDragMode = () => {
  isDragging = true;
  if ("vibrate" in navigator) {
    navigator.vibrate(100);
  }
  socket.emit("dragStart");
};

const endDragMode = () => {
  if (isDragging) {
    socket.emit("dragEnd");
    isDragging = false;
  }
};

const throttle = (callback, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      callback(...args);
    }
  };
};

const throttledMove = throttle(handleTouchMove, 32);

document.querySelectorAll(".action-button").forEach((button) => {
  button.addEventListener("click", function () {
    const action = this.getAttribute("data-action");

    if (action === "shutdown" || action === "sleep") {
      if (
        !confirm(
          `¿Are you sure to ${action === "shutdown" ? "shutdown" : "sleep"} your PC?`,
        )
      ) {
        return;
      }
    }

    socket.emit("media", action);

    this.classList.add("active");
    setTimeout(() => {
      this.classList.remove("active");
    }, 200);
  });
});

trackpad.addEventListener("touchmove", (e) => {
  e.preventDefault();
  throttledMove(e);
});

trackpad.addEventListener("touchstart", (e) => {
  e.preventDefault();

  // otherwise the keyboard input will be focused
  const keyboardInput = document.querySelector(".keyboard-input");
  if (keyboardInput && document.activeElement === keyboardInput) {
    keyboardInput.blur();
  }

  startX = [];
  startY = [];
  moved = false;
  clickPossible = false;

  for (let i = 0; i < e.touches.length; i++) {
    startX.push(e.touches[i].clientX - trackpad.offsetLeft);
    startY.push(e.touches[i].clientY - trackpad.offsetTop);
  }

  if (e.touches.length === 2) {
    twoFingerTouchStart = true;
    isTwoFingerGesture = true;
    initialDistance = getDistance(e.touches[0], e.touches[1]);
    lastZoomDistance = initialDistance;
    hasZoomed = false;
    hasScrolled = false;

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  } else if (e.touches.length === 1) {
    setTimeout(() => {
      clickPossible = true;
    }, clickDelay);

    if (!isTwoFingerGesture) {
      longPressTimer = setTimeout(() => {
        if (!moved) {
          startDragMode();
        }
        longPressTimer = null;
      }, longPressDuration);
    }
  }
});

trackpad.addEventListener("touchend", (e) => {
  e.preventDefault();

  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  if (
    !moved &&
    clickPossible &&
    e.touches.length === 0 &&
    !isTwoFingerGesture &&
    Date.now() - lastTwoFingerGestureTime > twoFingerGestureClickDelay
  ) {
    handleTouchClick(e);
  }

  if (twoFingerTouchStart && e.touches.length === 0) {
    handleTwoFingerTouchEnd(e);
    lastTwoFingerGestureTime = Date.now();
  }

  if (e.touches.length === 0) {
    // Send scrollEnd event to stop any pending scroll operations
    if (hasScrolled) {
      socket.emit("scrollEnd");
    }

    endDragMode();
    isTwoFingerGesture = false;
    initialDistance = 0;
    lastZoomDistance = 0;
    hasZoomed = false;
    hasScrolled = false;
  }

  moved = false;
});

window.addEventListener("orientationchange", sendDimensions);

window.addEventListener("resize", () => {
  document.querySelector(".container").style.height = `${window.innerHeight}px`;
});

document.addEventListener("DOMContentLoaded", async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.requestPermissions();
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  }

  const menuToggle = document.querySelector("#menuToggle");
  const menuPanel = document.querySelector("#menuPanel");
  const keyboardButton = document.querySelector(".circle");

  menuToggle.addEventListener("click", () => {
    menuPanel.classList.toggle("active");
  });

  keyboardButton.addEventListener("click", () => {
    // Check if keyboard input already exists
    const existingInput = document.body.querySelector(".keyboard-input");
    if (existingInput) {
      existingInput.focus();
      menuPanel.classList.remove("active");
      return;
    }

    // Create new keyboard input
    const input = createKeyboardInput();
    setupKeyboard(input);
    input.focus();
    menuPanel.classList.remove("active");
  });
});
