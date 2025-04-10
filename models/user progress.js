const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    achievements: { type: [String], default: [] }, // Earned badges
    socialGoals: {
        dailyGoalsCompleted: { type: Number, default: 0 },
        weeklyGoalsCompleted: { type: Number, default: 0 }
    },
    currentGoals: {
        type: [{ name: String, progress: Number, target: Number }],
        default: []
    }
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);
