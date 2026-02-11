const mongoose = require('mongoose');

const privateMessageSchema = new mongoose.Schema({
    from_user: {
        type: String,
        required: [true, 'From user is required'],
        trim: true
    },
    to_user: {
        type: String,
        required: [true, 'To user is required'],
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

module.exports = mongoose.model('PrivateMessage', privateMessageSchema);
