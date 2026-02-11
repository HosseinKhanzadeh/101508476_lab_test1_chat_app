require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'chat.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
