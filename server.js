require("dotenv").config(); // Load environment variables
console.log("MongoDB URI:", process.env.MONGO_URI);
const express = require("express"); // Import Express
const mongoose = require("mongoose"); // Import Mongoose
const app = express(); // Initialize Express app

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// MongoDB Connection Events
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB successfully!");
});

// Event Schema
const eventSchema = new mongoose.Schema({
    name: String,
    date: Date,
    time: String,
    location: String,
    type: String, // public or private
    rsvp: [String] // list of RSVPs (usernames)
});
const Event = mongoose.model('Event', eventSchema);

// Check-In Schema
const checkInSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    location: { type: String, required: true },
    companions: { type: [String], default: [] },
    socialPoints: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});
const CheckIn = mongoose.model('CheckIn', checkInSchema);

// Achievement Schema
const achievementSchema = new mongoose.Schema({
    name: { type: String, required: true },
    criteria: { type: Object, required: true },
    reward: { type: Object, required: true }
});
const Achievement = mongoose.model('Achievement', achievementSchema);

// User Progress Schema
const userProgressSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    achievements: { type: [String], default: [] },
    socialGoals: {
        dailyGoalsCompleted: { type: Number, default: 0 },
        weeklyGoalsCompleted: { type: Number, default: 0 }
    },
    currentGoals: {
        type: [{ name: String, progress: Number, target: Number }],
        default: []
    }
});
const UserProgress = mongoose.model('UserProgress', userProgressSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});
const Notification = mongoose.model('Notification', notificationSchema);

// Create Event API
app.post('/create-event', async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();
        res.send('Event Created');
    } catch (err) {
        console.error('Error Creating Event:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch Events API
app.get('/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        console.error('Error Fetching Events:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Create Check-In API
app.post('/check-in', async (req, res) => {
    const { userID, location, companions, socialPoints } = req.body;

    try {
        const newCheckIn = new CheckIn({ userID, location, companions, socialPoints });
        await newCheckIn.save();
        res.status(201).json({ message: 'Check-in successful!', checkIn: newCheckIn });
    } catch (err) {
        console.error('Error during check-in:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch Check-Ins API
app.get('/check-ins/:userID', async (req, res) => {
    const { userID } = req.params;

    try {
        const checkIns = await CheckIn.find({ userID });
        if (!checkIns.length) {
            res.status(404).json({ message: 'No check-ins found for this user.' });
        } else {
            res.json(checkIns);
        }
    } catch (err) {
        console.error('Error fetching check-ins:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch Achievements for a User API
app.get('/user/achievements/:userID', async (req, res) => {
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

// Add Achievement to a User API
app.post('/user/add-achievement', async (req, res) => {
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

// Update Progress Toward Social Goals API
app.post('/user/progress', async (req, res) => {
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
                userProgress.socialGoals.dailyGoalsCompleted += 1;
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

// Add Social Goal to a User API
app.post('/user/add-goal', async (req, res) => {
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

// Create Notification API
app.post('/notifications', async (req, res) => {
    try {
        const newNotif = new Notification(req.body);
        await newNotif.save();
        res.status(201).json({ message: 'Notification created', notification: newNotif });
    } catch (err) {
        console.error('Error creating notification:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Get Notifications for User
app.get('/notifications/:userID', async (req, res) => {
    try {
        const notifs = await Notification.find({ user_id: req.params.userID });
        res.json(notifs);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Mark Notification as Read
app.put('/notifications/:id/read', async (req, res) => {
    try {
        const notif = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        if (!notif) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification marked as read', notification: notif });
    } catch (err) {
        console.error('Error updating notification:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
