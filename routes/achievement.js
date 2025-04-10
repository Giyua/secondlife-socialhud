const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const UserProgress = require('../models/UserProgress');

// Get Achievements for a User
router.get('/user/achievements/:userID', async (req, res) => {
    try {
        const userProgress = await UserProgress.findOne({ userID: req.params.userID });
        if (!userProgress) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(userProgress.achievements);
    } catch (err) {
        console.error('Error fetching achievements:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Add Achievement to a User
router.post('/user/add-achievement', async (req, res) => {
    const { userID, achievementName } = req.body;

    try {
        const achievement = await Achievement.findOne({ name: achievementName });
        if (!achievement) {
            return res.status(404).json({ message: 'Achievement not found' });
        }

        const userProgress = await UserProgress.findOneAndUpdate(
            { userID },
            { $push: { achievements: achievement.reward.badge } },
            { new: true, upsert: true }
        );

        res.json({ message: 'Achievement added!', achievements: userProgress.achievements });
    } catch (err) {
        console.error('Error adding achievement:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
