const mongoose = require('mongoose');

const CheckInSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    location: { type: String, required: true },
    companions: { type: [String], default: [] }, // Array of companion IDs
    socialPoints: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CheckIn', CheckInSchema);
