const express = require('express');
const robot = require('robotjs');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3000;

const httpServer = createServer(app);

const io = new Server(httpServer);
const deviceDimensions = new Map();

app.use(express.json());
app.use(express.static('public'))

io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');

  socket.on('dimensions', (data) => {
    console.log('Dimensiones recibidas:', data);
    deviceDimensions.set(socket.id, data);
  });

  socket.on('movement', (data) => {
    const { deltaX, deltaY } = data;
    const dimensions = deviceDimensions.get(socket.id);

    if (!dimensions) {
      console.log('No se han recibido dimensiones para este cliente');
      return;
    }

    const currentPos = robot.getMousePos();

    const sensitivity = 5;

    let newX = currentPos.x + (deltaX * sensitivity);
    let newY = currentPos.y + (deltaY * sensitivity);

    const screenSize = robot.getScreenSize();
    newX = Math.max(0, Math.min(newX, screenSize.width - 1));
    newY = Math.max(0, Math.min(newY, screenSize.height - 1));

    robot.moveMouse(Math.round(newX), Math.round(newY));
    // console.log(`Mouse moved to: ${mouseX}, ${mouseY}`);
  });

  socket.on('disconnect', () => {
    console.log('Un cliente se ha desconectado');
  });
});

httpServer.listen(port, () => {
  console.log(`Server listenting on http://localhost:${port}`);
});
