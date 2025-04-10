const express = require('express');
const router = express.Router();
const CheckIn = require('../models/CheckIn');
const User = require('../models/User'); // Optional for social points

// POST Check-In
router.post('/check-in', async (req, res) => {
    const { userID, location, companions, socialPoints } = req.body;

    try {
        // Create a new check-in
        const newCheckIn = new CheckIn({ userID, location, companions, socialPoints });
        await newCheckIn.save();

        // Update user's total social points (optional)
        if (socialPoints && User) {
            const user = await User.findOneAndUpdate(
                { userID },
                { $inc: { totalSocialPoints: socialPoints } },
                { new: true, upsert: true } // Create user if not found
            );
        }

        res.status(201).json({ message: 'Check-in successful!', checkIn: newCheckIn });
    } catch (err) {
        console.error('Error during check-in:', err);
        res.status(500).send('Internal Server Error');
    }
});

// GET User's Total Points (optional)
router.get('/social-points/:userID', async (req, res) => {
    const { userID } = req.params;

    try {
        const user = await User.findOne({ userID });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ totalSocialPoints: user.totalSocialPoints });
    } catch (err) {
        console.error('Error fetching social points:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
