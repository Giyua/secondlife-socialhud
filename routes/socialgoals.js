const express = require('express');
const router = express.Router();
const UserProgress = require('../models/UserProgress');

// Update Progress Towards a Goal
router.post('/user/progress', async (req, res) => {
    const { userID, goalName, increment } = req.body;

    try {
        const userProgress = await UserProgress.findOne({ userID });
        if (!userProgress) {
            return res.status(404).json({ message: 'User not found' });
        }

        const goal = userProgress.currentGoals.find(g => g.name === goalName);
        if (goal) {
            goal.progress += increment;
            if (goal.progress >= goal.target) {
                userProgress.socialGoals.dailyGoalsCompleted += 1; // Example: track completion
                userProgress.currentGoals = userProgress.currentGoals.filter(g => g.name !== goalName);
            }
        }

        await userProgress.save();
        res.json(userProgress);
    } catch (err) {
        console.error('Error updating progress:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Add a New Goal
router.post('/user/add-goal', async (req, res) => {
    const { userID, goalName, target } = req.body;

    try {
        const userProgress = await UserProgress.findOneAndUpdate(
            { userID },
            { $push: { currentGoals: { name: goalName, progress: 0, target } } },
            { new: true, upsert: true }
        );
        res.json({ message: 'Goal added!', goals: userProgress.currentGoals });
    } catch (err) {
        console.error('Error adding goal:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
