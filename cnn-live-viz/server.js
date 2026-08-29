const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Serve everything from this same folder — no /public needed
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

io.on('connection', (socket) => {
  socket.on('create-room', (code) => {
    socket.join(code);
    socket.roomCode = code;
    console.log('display joined', code);
  });

  socket.on('join-room', (code) => {
    socket.join(code);
    socket.roomCode = code;
    socket.to(code).emit('drawer-connected');
    console.log('drawer joined', code);
  });

  socket.on('pixel-update', (data) => {
    if (socket.roomCode) socket.to(socket.roomCode).emit('pixel-update', data);
  });

  socket.on('clear-canvas', () => {
    if (socket.roomCode) socket.to(socket.roomCode).emit('clear-canvas');
  });

  socket.on('disconnect', () => {
    if (socket.roomCode) socket.to(socket.roomCode).emit('peer-disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));
