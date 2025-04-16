const express = require('express');
const robot = require('robotjs');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  maxHttpBufferSize: 1e3,
  pingTimeout: 60000,
  pingInterval: 25000,
});
const deviceDimensions = new Map();

app.use(express.json());
app.use(express.static('public'))

let pendingDeltaX = 0;
let pendingDeltaY = 0;
let processingQueue = false;

const processMouseQueue = () => {
  if (pendingDeltaX === 0 && pendingDeltaY === 0) {
    processingQueue = false;
    return;
  }

  const currentPos = robot.getMousePos();
  const sensitivity = 5;

  let newX = currentPos.x + (pendingDeltaX * sensitivity);
  let newY = currentPos.y + (pendingDeltaY * sensitivity);

  const screenSize = robot.getScreenSize();
  newX = Math.max(0, Math.min(newX, screenSize.width - 1));
  newY = Math.max(0, Math.min(newY, screenSize.height - 1));

  robot.moveMouse(Math.round(newX), Math.round(newY));

  pendingDeltaX = 0;
  pendingDeltaY = 0;

  setTimeout(processMouseQueue, 8);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('dimensions', (data) => {
    console.log('Device dimensions:', data);
    deviceDimensions.set(socket.id, data);
  });

  socket.on('movement', (deltaX, deltaY) => {
    console.log("Movement received:", deltaX, deltaY);

    pendingDeltaX += deltaX;
    pendingDeltaY += deltaY;

    if (!processingQueue) {
      processingQueue = true;
      processMouseQueue();
    }
  });

  socket.on('click', (button) => {
    console.log(`Click ${button} received`);
    if(button === 'right') {
      robot.mouseClick('right');
    } else {
      robot.mouseClick('left');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
