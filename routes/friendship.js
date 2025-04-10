const express = require('express');
const router = express.Router();
const Friends = require('../models/Friends');

// Update Trust Level
router.patch('/updateTrust', async (req, res) => {
    const { userID, friendID, amount } = req.body;
    try {
        const friendship = await Friends.findOne({ userID, friendID });
        if (friendship) {
            friendship.trustLevel = Math.min(100, friendship.trustLevel + amount);
            await friendship.save();
            res.status(200).json({ success: true, trustLevel: friendship.trustLevel });
        } else {
            res.status(404).json({ error: 'Friendship not found' });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});