const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// Room-based connections
const rooms = {};

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('create-room', (code) => {
    socket.join(code);
    rooms[code] = rooms[code] || { displays: [], drawers: [] };
    rooms[code].displays.push(socket.id);
    socket.roomCode = code;
    console.log(`Display joined room: ${code}`);
  });

  socket.on('join-room', (code) => {
    socket.join(code);
    rooms[code] = rooms[code] || { displays: [], drawers: [] };
    rooms[code].drawers.push(socket.id);
    socket.roomCode = code;
    socket.to(code).emit('drawer-connected');
    console.log(`Drawer joined room: ${code}`);
  });

  socket.on('draw-data', (data) => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit('draw-data', data);
    }
  });

  socket.on('pixel-update', (data) => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit('pixel-update', data);
    }
  });

  socket.on('clear-canvas', () => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit('clear-canvas');
    }
  });

  socket.on('disconnect', () => {
    if (socket.roomCode && rooms[socket.roomCode]) {
      socket.to(socket.roomCode).emit('peer-disconnected');
    }
    console.log('Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
