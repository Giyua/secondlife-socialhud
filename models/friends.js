const mongoose = require('mongoose');
const FriendsSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    friendID: { type: String, required: true },
    bondLevel: { type: Number, default: 0 },
    trustLevel: { type: Number, default: 50 },
    friendshipElement: { type: String, default: "none" },
    auraColor: { type: String, default: "#FFFFFF" },
    lastInteraction: { type: Date, default: Date.now },
    bestFriendStatus: { type: Boolean, default: false }
});
module.exports = mongoose.model('Friends', FriendsSchema);
