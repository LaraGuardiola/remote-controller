const express = require("express");
const robot = require("robotjs");
const { createServer } = require("http");
const { Server } = require("socket.io");
const os = require("os");
const { executeSystemCommand, openRocketLeague, getIp } = require("./utils.js");
const { systemCommands } = require("./commands.js");

const app = express();
const port = 3000;
const ip = getIp();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // for testing purposes
  },
  maxHttpBufferSize: 1e3,
  pingTimeout: 60000,
  pingInterval: 25000,
});
const deviceDimensions = new Map();

app.use(express.json());
app.use(express.static("public"));

let pendingDeltaX = 0;
let pendingDeltaY = 0;
let processingQueue = false;
let isDragging = false;

const platform = os.platform();

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
  console.log("Client connected:", socket.id);

  socket.on("dimensions", (data) => {
    console.log("Device dimensions:", data);
    deviceDimensions.set(socket.id, data);
  });

  socket.on("movement", (deltaX, deltaY) => {
    console.log("Movement received:", deltaX, deltaY);

    pendingDeltaX += deltaX;
    pendingDeltaY += deltaY;

    if (!processingQueue) {
      processingQueue = true;
      processMouseQueue();
    }
  });

  socket.on("click", (button) => {
    console.log(`Click ${button} received`);
    if (button === "right") {
      robot.mouseClick("right");
    } else {
      robot.mouseClick("left");
    }
  });

  socket.on("dragStart", () => {
    console.log("Dragging received");
    isDragging = true;
    robot.mouseToggle("down", "left");
  });

  socket.on("drag", (deltaX, deltaY) => {
    console.log("Dragging:", deltaX, deltaY);
    pendingDeltaX += deltaX;
    pendingDeltaY += deltaY;

    if (!processingQueue) {
      processingQueue = true;
      processMouseQueue();
    }
  });

  socket.on("dragEnd", () => {
    console.log("End dragging");
    isDragging = false;
    robot.mouseToggle("up", "left");
  });

  socket.on("zoom", (direction, magnitude) => {
    console.log(`Zoom ${direction} received`);

    if (direction === "in") {
      robot.keyTap("+", "control");
    } else if (direction === "out") {
      robot.keyTap("-", "control");
    }
  });

  socket.on("scroll", (direction, magnitude) => {
    console.log(`Scroll ${direction} received with magnitude:`, magnitude);

    const scrollAmount = Math.max(1, Math.round(magnitude)) * 4;

    try {
      if (direction === "up") {
        console.log(`Scrolling up with mouse wheel amount: ${scrollAmount}`);
        robot.scrollMouse(0, scrollAmount);
      } else if (direction === "down") {
        console.log(`Scrolling down with mouse wheel amount: ${scrollAmount}`);
        robot.scrollMouse(0, -scrollAmount);
      }
    } catch (error) {
      console.error("Error with scrollMouse:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
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
          console.log("Backspace pressed");
          break;
        case "enter":
          robot.keyTap("enter");
          console.log("Enter pressed");
          break;
        case "tab":
          robot.keyTap("tab");
          console.log("Tab pressed");
          break;
        default:
          // Use typeString for all characters to bypass keyboard layout issues
          robot.typeString(key);
          console.log(`Typed character: ${key}`);
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

// Simple helper for system commands that gets messages from config
const executeCommand = (commandKey) => {
  const config = systemCommands[commandKey];
  if (config && config[platform]) {
    executeSystemCommand(config[platform])
      .then(() => console.log(config.successMessage))
      .catch((err) => console.error(`${config.errorMessage}:`, err));
  } else {
    console.log(`Command "${commandKey}" not supported on ${platform}`);
  }
};

// Simple helper for keyboard shortcuts
const executeKeyboardShortcut = (commandKey, key, modifier = "control") => {
  const config = systemCommands[commandKey];
  if (config && config[platform]) {
    robot.keyTap(key, modifier);
    console.log(config.successMessage);
  } else {
    console.log(`${commandKey} not supported on ${platform}`);
  }
};

httpServer.listen(port, () => {
  console.log(`Remote controller listening on http://${ip}:${port}`);
});
