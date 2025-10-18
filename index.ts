import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server as SocketIOServer } from "socket.io";
import { readFile } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mouse, keyboard, screen } from "./mecha";
import {
  displayRemoteControllerAscii,
  executeCommand,
  executeKeyboardShortcut,
  openRocketLeague,
  getIp,
  log,
} from "./utils";

const port: number = 3000;
const ip: string = getIp();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Dimensions = {
  width: number;
  height: number;
};

const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  // Health check endpoint
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ ip }));
    return;
  }

  const filePath: string = req.url ?? "/";
  const fullPath: string = join(__dirname, "public", filePath);
  readFile(fullPath, (err: NodeJS.ErrnoException | null, data: Buffer) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
    } else {
      let contentType: string = "text/plain";
      if (filePath.endsWith(".html")) contentType = "text/html";
      if (filePath.endsWith(".css")) contentType = "text/css";
      if (filePath.endsWith(".js")) contentType = "application/javascript";
      if (filePath.endsWith(".svg")) contentType = "image/svg+xml";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", // for testing purposes
  },
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

  //testing 60fps and more
  processMouseQueue();
  // setTimeout(processMouseQueue, 0);
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
      // robot.mouseClick("right");
      mouse.rightClick();
    } else {
      // robot.mouseClick("left");
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
    // robot.mouseToggle("up", "left");
    mouse.mouseToggle("up", "left");
  });

  socket.on("zoom", (direction: string, magnitude: number) => {
    console.log(`[ZOOM EVENT] Zoom ${direction} received`);

    if (direction === "in") {
      keyboard.zoomIn();
    } else if (direction === "out") {
      keyboard.zoomOut();
    }
  });

  socket.on("scroll", (direction: string, magnitude: number) => {
    // Escala la magnitud (ajusta estos valores según tu preferencia)
    const scrollAmount = Math.max(1, Math.round(magnitude / 2));

    console.log(
      `[SCROLL EVENT] Scroll ${direction} with magnitude:`,
      scrollAmount
    );

    try {
      if (direction === "up") {
        // Positivo = scroll arriba
        mouse.scroll(scrollAmount);
      } else if (direction === "down") {
        // Negativo = scroll abajo
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
      // Mapeo de teclas especiales
      const specialKeys = {
        backspace: "BACK",
        enter: "RETURN",
        tab: "TAB",
        delete: "DELETE",
        escape: "ESCAPE",
      };

      const lowerKey = key.toLowerCase();

      // Si es una tecla especial, usar tap()
      if (specialKeys[lowerKey]) {
        keyboard.tap(specialKeys[lowerKey]);
        console.log(`[KEYBOARD EVENT] Special key: ${lowerKey}`);
      }
      // Si es un carácter normal, usar type()
      else {
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

httpServer.listen(port, () => {
  displayRemoteControllerAscii();
});
