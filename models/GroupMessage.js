const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
    from_user: {
        type: String,
        required: [true, 'From user is required'],
        trim: true
    },
    room: {
        type: String,
        required: [true, 'Room is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true
    },
    date_sent: {
        type: String,
        required: [true, 'Date sent is required']
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
