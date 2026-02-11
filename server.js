require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./db');
const User = require('./models/User');
const GroupMessage = require('./models/GroupMessage');
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

/** Last 50 group messages for a room, newest first */
app.get('/api/messages/group/:room', async (req, res) => {
    try {
        const room = decodeURIComponent(req.params.room || '').trim();
        if (!room) {
            return res.status(400).json({ error: 'Room name required' });
        }
        const messages = await GroupMessage.find({ room })
            .sort({ _id: -1 })
            .limit(50)
            .lean();
        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** MM-DD-YYYY HH:MM PM */
function getDateSent() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month}-${day}-${year} ${hours}:${minutes} ${ampm}`;
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (data) => {
        const room = (data && data.room && String(data.room).trim()) || '';
        const username = (data && data.username && String(data.username).trim()) || '';
        if (room && username) {
            socket.join(room);
        }
    });

    socket.on('leave_room', (data) => {
        const room = (data && data.room && String(data.room).trim()) || '';
        if (room) {
            socket.leave(room);
        }
    });

    socket.on('room_message', async (data) => {
        const room = (data && data.room && String(data.room).trim()) || '';
        const from_user = (data && data.from_user && String(data.from_user).trim()) || '';
        const message = (data && data.message != null) ? String(data.message).trim() : '';
        if (!room || !from_user || !message) {
            return;
        }
        const date_sent = getDateSent();
        try {
            await GroupMessage.create({ from_user, room, message, date_sent });
        } catch (err) {
            console.error('GroupMessage save error:', err.message);
            return;
        }
        io.to(room).emit('room_message', { room, from_user, message, date_sent });
    });

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
