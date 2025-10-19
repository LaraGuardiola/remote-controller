import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Socket } from "socket.io-client";
import { initConnection } from "./connection";
import { setHeaderScanning } from "./layout";
import * as EVENTS from "./events";

const trackpad = document.querySelector<HTMLElement>(".trackpad")!;
let socket: Socket | null = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.requestPermissions();
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  }

  const menuToggle = document.querySelector<HTMLElement>("#menuToggle")!;
  const menuPanel = document.querySelector<HTMLElement>("#menuPanel")!;
  const keyboardButton = document.querySelector<HTMLElement>(".circle")!;

  menuToggle.addEventListener("click", () => {
    menuPanel.classList.toggle("active");
  });

  keyboardButton.addEventListener("click", () => {
    // Check if keyboard input already exists
    const existingInput =
      document.body.querySelector<HTMLInputElement>(".keyboard-input");
    if (existingInput) {
      existingInput.focus();
      menuPanel.classList.remove("active");
      return;
    }
    // Create new keyboard input
    const input = EVENTS.createKeyboardInput();
    EVENTS.setupKeyboard(input, socket!);
    input.focus();
    menuPanel.classList.remove("active");
  });

  setHeaderScanning();
  socket = await initConnection();

  window.addEventListener("socket-reconnected", ((e: CustomEvent) => {
    console.log("Socket reconnected after rescan");
    socket = e.detail.socket;
  }) as EventListener);

  window.addEventListener("orientationchange", () => {
    EVENTS.sendDimensions(socket!);
  });

  window.addEventListener("resize", () => {
    const container = document.querySelector<HTMLElement>(".container")!;
    container.style.height = `${window.innerHeight}px`;
  });

  trackpad.addEventListener("touchstart", (e: TouchEvent) => {
    EVENTS.handleTouchStart(e, socket!);
  });

  trackpad.addEventListener("touchmove", (e: TouchEvent) => {
    e.preventDefault();
    EVENTS.throttledMove(e, socket!);
  });

  trackpad.addEventListener("touchend", (e: TouchEvent) => {
    EVENTS.handleTouchEnd(e, socket!);
  });

  document.querySelectorAll<HTMLElement>(".action-button").forEach((button) => {
    button.addEventListener("click", () => {
      EVENTS.sendAction(button, socket!);
    });
  });
});
