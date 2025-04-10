const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    totalSocialPoints: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', UserSchema);
