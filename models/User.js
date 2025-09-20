const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,  // ตรวจสอบให้แน่ใจว่าเป็น required
    },
    email: {
        type: String,
        required: true,  // ตรวจสอบให้แน่ใจว่าเป็น required
        unique: true,
    },
    phone: String,
    address: String,
    status: {
        type: String,
        default: 'active',
    },
    membership_date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('User', userSchema);
