import robot from "robotjs_addon";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFile } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  executeCommand,
  executeKeyboardShortcut,
  openRocketLeague,
  getIp,
} from "./utils.js";

const port = 3000;
const ip = getIp();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const httpServer = createServer((req, res) => {
  // Health check endpoint
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ ip }));
    return;
  }

  let filePath = req.url === "/" ? "/index.html" : req.url;
  const fullPath = join(__dirname, "public", filePath);
  readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
    } else {
      let contentType = "text/plain";
      if (filePath.endsWith(".html")) contentType = "text/html";
      if (filePath.endsWith(".css")) contentType = "text/css";
      if (filePath.endsWith(".js")) contentType = "application/javascript";
      if (filePath.endsWith(".svg")) contentType = "image/svg+xml";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

// const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // for testing purposes
  },
  maxHttpBufferSize: 1e3,
  pingTimeout: 60000,
  pingInterval: 25000,
});

const deviceDimensions = new Map();
let pendingDeltaX = 0;
let pendingDeltaY = 0;
let processingQueue = false;
let isDragging = false;

const processMouseQueue = () => {
  if (pendingDeltaX === 0 && pendingDeltaY === 0) {
    processingQueue = false;
    return;
  }

  const currentPos = robot.getMousePos();
  const sensitivity = isDragging ? 3 : 5;

  let newX = currentPos.x + pendingDeltaX * sensitivity;
  let newY = currentPos.y + pendingDeltaY * sensitivity;

  const screenSize = robot.getScreenSize();
  newX = Math.max(0, Math.min(newX, screenSize.width - 1));
  newY = Math.max(0, Math.min(newY, screenSize.height - 1));

  robot.moveMouse(Math.round(newX), Math.round(newY));

  pendingDeltaX = 0;
  pendingDeltaY = 0;

  setTimeout(processMouseQueue, 8);
};

io.on("connection", (socket) => {
  console.log("[CLIENT] Client connected:", socket.id);

  socket.on("dimensions", (data) => {
    console.log("[CLIENT] Device dimensions:", data);
    deviceDimensions.set(socket.id, data);
  });

  socket.on("movement", (deltaX, deltaY) => {
    console.log("[MOUSE EVENT] Movement received:", deltaX, deltaY);

    pendingDeltaX += deltaX;
    pendingDeltaY += deltaY;

    if (!processingQueue) {
      processingQueue = true;
      processMouseQueue();
    }
  });

  socket.on("click", (button) => {
    console.log(`[CLICK EVENT] Click ${button} received`);
    if (button === "right") {
      robot.mouseClick("right");
    } else {
      robot.mouseClick("left");
    }
  });

  socket.on("dragStart", () => {
    console.log("[DRAG EVENT] Dragging received");
    isDragging = true;
    robot.mouseToggle("down", "left");
  });

  socket.on("drag", (deltaX, deltaY) => {
    console.log("[DRAG EVENT] Dragging:", deltaX, deltaY);
    pendingDeltaX += deltaX;
    pendingDeltaY += deltaY;

    if (!processingQueue) {
      processingQueue = true;
      processMouseQueue();
    }
  });

  socket.on("dragEnd", () => {
    console.log("[DRAG EVENT] End dragging");
    isDragging = false;
    robot.mouseToggle("up", "left");
  });

  socket.on("zoom", (direction, magnitude) => {
    console.log(`[ZOOM EVENT] Zoom ${direction} received`);

    if (direction === "in") {
      robot.keyTap("+", "control");
    } else if (direction === "out") {
      robot.keyTap("-", "control");
    }
  });

  socket.on("scroll", (direction, magnitude) => {
    const scrollAmount = Math.max(1, Math.round(magnitude)) * 4;
    console.log(
      `[SCROLL EVENT] Scroll ${direction} received with magnitude:`,
      scrollAmount,
    );

    try {
      if (direction === "up") {
        robot.scrollMouse(0, -scrollAmount);
      } else if (direction === "down") {
        robot.scrollMouse(0, scrollAmount);
      }
    } catch (error) {
      console.error("Error with scrollMouse:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("[CLIENT] Client disconnected:", socket.id);
    if (isDragging) {
      isDragging = false;
      robot.mouseToggle("up", "left");
    }
  });

  socket.on("keyboard", (data) => {
    const { key } = data;
    try {
      switch (key) {
        case "backspace":
          robot.keyTap("backspace");
          console.log("[KEYBOARD EVENT] Backspace pressed");
          break;
        case "enter":
          robot.keyTap("enter");
          console.log("[KEYBOARD EVENT] Enter pressed");
          break;
        case "tab":
          robot.keyTap("tab");
          console.log("[KEYBOARD EVENT] Tab pressed");
          break;
        default:
          // Use typeString for all characters to bypass keyboard layout issues
          robot.typeString(key);
          console.log(`[KEYBOARD EVENT] Typed character: ${key}`);
          break;
      }
    } catch (error) {
      console.error("Error typing character:", key, error);
    }
  });

  socket.on("media", (command) => {
    try {
      switch (command) {
        case "shutdown":
          executeCommand("shutdown");
          break;
        case "volume-up":
          executeCommand("volumeUp");
          break;
        case "volume-down":
          executeCommand("volumeDown");
          break;
        case "play-pause":
          executeCommand("playPause");
          break;
        case "mute":
          executeCommand("mute");
          break;
        case "prev-track":
          executeCommand("prevTrack");
          break;
        case "next-track":
          executeCommand("nextTrack");
          break;
        case "lock":
          executeCommand("lock");
          break;
        case "sleep":
          executeCommand("sleep");
          break;
        case "task-manager":
          executeKeyboardShortcut("taskManager", "escape", [
            "control",
            "shift",
          ]);
          break;
        case "copy":
          executeKeyboardShortcut("copy", "c");
          break;
        case "paste":
          executeKeyboardShortcut("paste", "v");
          break;
        case "undo":
          executeKeyboardShortcut("undo", "z");
          break;
        case "redo":
          executeKeyboardShortcut("redo", "y");
          break;
        case "rocket-league":
          openRocketLeague();
          break;
      }
    } catch (error) {
      console.error("Error executing command:", error);
    }
  });
});

httpServer.listen(port, () => {
  console.log(`Remote controller listening on http://${ip}:${port}`);
});
