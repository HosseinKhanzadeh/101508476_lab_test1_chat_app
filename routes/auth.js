const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

router.get('/ping', (req, res) => {
    res.json({ ok: true, route: 'auth router mounted' });
});

/** Format date as MM-DD-YYYY HH:MM PM */
function getCreateon() {
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

router.post('/signup', async (req, res) => {
    console.log('[auth] POST', req.path, 'body:', JSON.stringify(req.body));
    try {
        const { username, firstname, lastname, password } = req.body || {};
        if (!username || !firstname || !lastname || !password) {
            return res.json({
                success: false,
                message: 'Username, first name, last name, and password are required.'
            });
        }
        const trimmedUsername = String(username).trim();
        const trimmedFirst = String(firstname).trim();
        const trimmedLast = String(lastname).trim();
        if (!trimmedUsername || !trimmedFirst || !trimmedLast) {
            return res.json({
                success: false,
                message: 'Username, first name, and last name cannot be empty.'
            });
        }
        if (!String(password).trim()) {
            return res.json({
                success: false,
                message: 'Password cannot be empty.'
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const createon = getCreateon();
        const user = new User({
            username: trimmedUsername,
            firstname: trimmedFirst,
            lastname: trimmedLast,
            password: hashedPassword,
            createon
        });
        await user.save();
        return res.json({ success: true });
    } catch (error) {
        if (error.code === 11000) {
            return res.json({
                success: false,
                message: 'Username already exists.'
            });
        }
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors).map(e => e.message).join(' ');
            return res.json({ success: false, message: msg });
        }
        return res.json({
            success: false,
            message: error.message || 'Signup failed.'
        });
    }
});

router.post('/login', async (req, res) => {
    console.log('[auth] POST', req.path, 'body:', JSON.stringify(req.body));
    try {
        const { username, password } = req.body || {};
        if (!username || !password) {
            return res.json({
                success: false,
                message: 'Username and password are required.'
            });
        }
        const user = await User.findOne({ username: String(username).trim() });
        if (!user) {
            return res.json({
                success: false,
                message: 'Invalid username or password.'
            });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.json({
                success: false,
                message: 'Invalid username or password.'
            });
        }
        const userResponse = {
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname
        };
        return res.json({ success: true, user: userResponse });
    } catch (error) {
        return res.json({
            success: false,
            message: error.message || 'Login failed.'
        });
    }
});

module.exports = router;
