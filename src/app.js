import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { initConnection } from "./connection";
import * as EVENTS from "./events";

const trackpad = document.querySelector(".trackpad");
let socket = null;

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
    const input = EVENTS.createKeyboardInput();
    EVENTS.setupKeyboard(input, socket);
    input.focus();
    menuPanel.classList.remove("active");
  });

  socket = await initConnection();

  window.addEventListener("orientationchange", EVENTS.sendDimensions(socket));

  window.addEventListener("resize", () => {
    document.querySelector(
      ".container"
    ).style.height = `${window.innerHeight}px`;
  });

  trackpad.addEventListener("touchstart", (e) => {
    EVENTS.handleTouchStart(e, socket);
  });

  trackpad.addEventListener("touchmove", (e) => {
    e.preventDefault();
    EVENTS.throttledMove(e, socket);
  });

  trackpad.addEventListener("touchend", (e) => {
    EVENTS.handleTouchEnd(e, socket);
  });

  document.querySelectorAll(".action-button").forEach((button) => {
    button.addEventListener("click", () => {
      EVENTS.sendAction(button, socket);
    });
  });
});
