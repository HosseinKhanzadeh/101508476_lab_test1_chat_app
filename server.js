require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./db');
const User = require('./models/User');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;


connectDB();

app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authRoutes);

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

app.get('/db-test', async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json({ db: 'ok', userCount: count });
    } catch (error) {
        res.status(500).json({ db: 'error', message: error.message });
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in .env to a different port.`);
        process.exit(1);
    }
    throw err;
});

server.listen(PORT, () => {
    const mongoSet = Boolean(process.env.MONGO_URI);
    let dbName = '(not parsed)';
    try {
        const u = new URL(process.env.MONGO_URI || '');
        const pathname = (u.pathname || '').replace(/^\/+/, '') || '';
        dbName = pathname.split('?')[0] || '(default)';
    } catch (_) {}
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('MONGO_URI set:', mongoSet);
    console.log('DB name (from URI):', dbName);
});
