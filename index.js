const express = require('express');
const robot = require('robotjs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const os = require('os');
const { executeSystemCommand } = require('./utils.js');
const { systemCommands } = require('./commands.js');

const app = express();
const port = 3000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*', // for testing purposes
  },
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
let isDragging = false;

const platform = os.platform();

const processMouseQueue = () => {
  if (pendingDeltaX === 0 && pendingDeltaY === 0) {
    processingQueue = false;
    return;
  }

  const currentPos = robot.getMousePos();
  const sensitivity = isDragging ? 3 : 5;

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
    if (button === 'right') {
      robot.mouseClick('right');
    } else {
      robot.mouseClick('left');
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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (isDragging) {
      isDragging = false;
      robot.mouseToggle("up", "left");
    }
  });

  socket.on('media', (command) => {
    try {
      switch (command) {
        case 'shutdown':
          if (systemCommands.shutdown[platform]) {
            executeSystemCommand(systemCommands.shutdown[platform])
              .then(() => console.log('PC shutting down...'))
              .catch(err => console.error('Error shutting down PC:', err));
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'volume-up':
          if (systemCommands.volumeUp[platform]) {
            executeSystemCommand(systemCommands.volumeUp[platform])
              .then(() => console.log('Raising volume...'))
              .catch(err => console.error('Error raising volume:', err));
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'volume-down':
          if (systemCommands.volumeDown[platform]) {
            executeSystemCommand(systemCommands.volumeDown[platform])
              .then(() => console.log('Lowering volume...'))
              .catch(err => console.error('Error lowering volume:', err));
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'play-pause':
          if (systemCommands.playPause[platform]) {
            executeSystemCommand(systemCommands.playPause[platform])
              .then(() => console.log('Play / stop ...'))
              .catch(err => console.error('Error playing/stopping media:', err));
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'mute':
          if (systemCommands.mute[platform]) {
            executeSystemCommand(systemCommands.mute[platform])
              .then(() => console.log('Muted / unmuted media...'))
              .catch(err => console.error('Error muting media:', err));
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'prev-track':
          if (systemCommands.prevTrack[platform]) {
            executeSystemCommand(systemCommands.prevTrack[platform])
              .then(() => console.log('Previous track...'))
              .catch(err => console.error('Error playing previous track:', err));
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'next-track':
          if (systemCommands.nextTrack[platform]) {
            executeSystemCommand(systemCommands.nextTrack[platform])
              .then(() => console.log('next track...'))
              .catch(err => console.error('Error playing next track:', err));
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'lock':
          if (systemCommands.lock[platform]) {
            executeSystemCommand(systemCommands.lock[platform])
              .then(() => console.log('Locking pc...'))
              .catch(err => console.error('Error locking pc:', err));
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'sleep':
          if (systemCommands.sleep[platform]) {
            executeSystemCommand(systemCommands.sleep[platform])
              .then(() => console.log('Going to sleep 😴...'))
              .catch(err => console.error('Error before going to sleep:', err));
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'task-manager':
          if (systemCommands.taskManager[platform]) {
            robot.keyTap('escape', ['control', 'shift']);
            console.log('Opening task manager...')
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'copy':
          if (systemCommands.copy[platform]) {
            robot.keyTap('c', 'control')
            console.log('Copying...')
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'paste':
          if (systemCommands.paste[platform]) {
            robot.keyTap('v', 'control')
            console.log('Paste...')
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'undo':
          if (systemCommands.undo[platform]) {
            robot.keyTap('z', 'control')
            console.log('Undo...')
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
        case 'redo':
          if (systemCommands.redo[platform]) {
            robot.keyTap('y', 'control')
            console.log('Redo...')
          } else {
            console.log(`Not supported on ${platform}`);
          }
          break;
      }
    } catch (error) {
      console.error('Error executing command:', error);
    }
  })
});

httpServer.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
console.log(`Not supported on ${platform}`);