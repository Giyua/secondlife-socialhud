const mongoose = require('mongoose');
const ChallengesSchema = new mongoose.Schema({
    challengeID: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    participants: [String],
    progress: { type: Number, default: 0 },
    goal: { type: Number, required: true },
    reward: { type: String, required: true }
});
module.exports = mongoose.model('Challenges', ChallengesSchema);
