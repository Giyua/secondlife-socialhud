const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
    name: { type: String, required: true },
    criteria: { type: Object, required: true }, // Achievement conditions
    reward: { type: Object, required: true }    // Badge and points rewarded
});

module.exports = mongoose.model('Achievement', AchievementSchema);
