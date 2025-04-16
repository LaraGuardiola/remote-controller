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
    // console.log('Movimiento recibido:', data);
    const dimensions = deviceDimensions.get(socket.id);
    if (!dimensions) {
      console.log('No se han recibido dimensiones para este cliente');
      return;
    }
    const { x, y } = data;
    const { width, height } = dimensions;
    const screenWidth = robot.getScreenSize().width;
    const screenHeight = robot.getScreenSize().height;
    const trackpadWidth = width; 
    const trackpadHeight = height; 

    const mouseX = Math.round((x / trackpadWidth) * screenWidth);
    const mouseY = Math.round((y / trackpadHeight) * screenHeight);

    robot.moveMouse(mouseX, mouseY);
    // console.log(`Mouse moved to: ${mouseX}, ${mouseY}`);
  });

  socket.on('disconnect', () => {
    console.log('Un cliente se ha desconectado');
  });
});

// Iniciar el servidor
httpServer.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
