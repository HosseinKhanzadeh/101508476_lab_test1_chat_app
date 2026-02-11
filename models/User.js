const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true
    },
    firstname: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastname: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    createon: {
        type: String,
        required: true
    }
}, {
    timestamps: false
});

// Ensure unique index on username (removed duplicate - using unique: true in schema)

module.exports = mongoose.model('User', userSchema);
