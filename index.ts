import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { join, dirname } from "path";
import { networkInterfaces } from "os";
import { mouse, keyboard, screen } from "./mecha";
import {
  displayRemoteControllerAscii,
  executeCommand,
  executeKeyboardShortcut,
  openRocketLeague,
  getIp,
  log,
} from "./utils";

const port: number = 5173;
const ip: string = getIp();

const isDev = process.argv.includes("--dev");
const baseDir = isDev ? process.cwd() : dirname(process.execPath);
const staticDir = join(baseDir, "dist");

type Dimensions = {
  width: number;
  height: number;
};

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

  const filePath = req.url === "/" ? "/index.html" : req.url ?? "/";
  const fullPath = join(staticDir, filePath);

  (async () => {
    try {
      const file = Bun.file(fullPath);

      if (await file.exists()) {
        const data = await file.arrayBuffer();
        res.writeHead(200, {
          "Content-Type": file.type || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(Buffer.from(data));
      } else {
        console.error(`❌ File not found: ${fullPath}`);
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      }
    } catch (error) {
      console.error(`❌ Error serving file: ${fullPath}`, error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal server error");
    }
  })();
});

const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e3,
  pingTimeout: 60000,
  pingInterval: 25000,
});

const deviceDimensions = new Map<string, Dimensions>();
let pendingDeltaX: number = 0;
let pendingDeltaY: number = 0;
let processingQueue: boolean = false;
let isDragging: boolean = false;

const processMouseQueue = (): void => {
  if (pendingDeltaX === 0 && pendingDeltaY === 0) {
    processingQueue = false;
    return;
  }

  const currentPos = mouse.getPosition();
  const sensitivity = isDragging ? 3 : 5;

  let newX = currentPos.x + pendingDeltaX * sensitivity;
  let newY = currentPos.y + pendingDeltaY * sensitivity;

  const screenSize = screen.getSize();
  newX = Math.max(0, Math.min(newX, screenSize.width - 1));
  newY = Math.max(0, Math.min(newY, screenSize.height - 1));

  mouse.moveTo(Math.round(newX), Math.round(newY));

  pendingDeltaX = 0;
  pendingDeltaY = 0;

  processMouseQueue();
};

io.on("connection", (socket) => {
  console.log("[CLIENT] Client connected:", socket.id);

  socket.on("dimensions", (data: Dimensions) => {
    console.log("[CLIENT] Device dimensions:", data);
    deviceDimensions.set(socket.id, data);
  });

  socket.on("movement", (deltaX: number, deltaY: number) => {
    console.log("[MOUSE EVENT] Movement received:", deltaX, deltaY);

    pendingDeltaX += deltaX;
    pendingDeltaY += deltaY;

    if (!processingQueue) {
      processingQueue = true;
      processMouseQueue();
    }
  });

  socket.on("click", (button: string) => {
    console.log(`[CLICK EVENT] Click ${button} received`);
    if (button === "right") {
      mouse.rightClick();
    } else {
      mouse.leftClick();
    }
  });

  socket.on("dragStart", () => {
    console.log("[DRAG EVENT] Start dragging");
    isDragging = true;
    mouse.mouseToggle("down", "left");
  });

  socket.on("drag", (deltaX: number, deltaY: number) => {
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
    mouse.mouseToggle("up", "left");
  });

  socket.on("zoom", (direction: string) => {
    console.log(`[ZOOM EVENT] Zoom ${direction} received`);

    if (direction === "in") {
      keyboard.zoomIn();
    } else if (direction === "out") {
      keyboard.zoomOut();
    }
  });

  socket.on("scroll", (direction: string, magnitude: number) => {
    const scrollAmount = Math.max(1, Math.round(magnitude / 2));

    console.log(
      `[SCROLL EVENT] Scroll ${direction} with magnitude:`,
      scrollAmount
    );

    try {
      if (direction === "up") {
        mouse.scroll(scrollAmount);
      } else if (direction === "down") {
        mouse.scroll(-scrollAmount);
      }
    } catch (error) {
      console.error("Error with scroll:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("[CLIENT] Client disconnected:", socket.id);
    if (isDragging) {
      isDragging = false;
      mouse.mouseToggle("up", "left");
    }
  });

  socket.on("keyboard", (data: { key: string }) => {
    const { key } = data;
    try {
      const specialKeys = {
        backspace: "BACK",
        enter: "RETURN",
        tab: "TAB",
        delete: "DELETE",
        escape: "ESCAPE",
      };

      const lowerKey = key.toLowerCase();

      if (specialKeys[lowerKey]) {
        keyboard.tap(specialKeys[lowerKey]);
        console.log(`[KEYBOARD EVENT] Special key: ${lowerKey}`);
      } else {
        keyboard.type(key);
        console.log(`[KEYBOARD EVENT] Typed character: ${key}`);
      }
    } catch (error) {
      console.error("Error typing character:", key, error);
    }
  });

  socket.on("media", (command: string) => {
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
          executeCommand("taskManager");
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

httpServer.listen(port, "0.0.0.0", () => {
  let localIP = "localhost";
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) {
        localIP = net.address;
        break;
      }
    }
  }

  displayRemoteControllerAscii();
  if (!isDev) {
    console.log(`🚀 Server running:`);
    console.log(`   Local:   http://localhost:${port}`);
    console.log(`   Network: http://${localIP}:${port}\n`);
  }
});
