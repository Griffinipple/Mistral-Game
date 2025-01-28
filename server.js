const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('respawn', (data) => {
        io.emit('playerRespawn', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(3000, () => console.log('Server running on port 3000'));
