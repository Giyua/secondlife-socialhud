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

// Favorite Schema
const favoriteSchema = new mongoose.Schema({
    title: { type: String },
    url: { type: String, required: true },
    addedAt: { type: Date, default: Date.now }
});

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
    },
    favorites: {
        type: [favoriteSchema],
        default: []
    },
    groups: {
        type: [mongoose.Schema.Types.ObjectId], // Reference to Group Schema
        ref: 'Group',
        default: []
    }
});
const UserProgress = mongoose.model('UserProgress', userProgressSchema);

// Group Schema
const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    members: { type: [String], default: [] }, // List of User IDs
    createdAt: { type: Date, default: Date.now }
});
const Group = mongoose.model('Group', groupSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});
const Notification = mongoose.model('Notification', notificationSchema);

// API to Create a Group
app.post('/create-group', async (req, res) => {
    const { name, description, members } = req.body;

    try {
        const newGroup = new Group({
            name,
            description,
            members
        });

        await newGroup.save();

        // Optionally, update user progress to include the new group
        for (const userID of members) {
            await UserProgress.findOneAndUpdate(
                { userID },
                { $push: { groups: newGroup._id } }
            );
        }

        res.status(201).json({ message: 'Group created successfully!', group: newGroup });
    } catch (err) {
        console.error('Error creating group:', err);
        res.status(500).send('Internal Server Error');
    }
});

// API to Add a User to a Group
app.post('/add-to-group', async (req, res) => {
    const { groupID, userID } = req.body;

    try {
        const group = await Group.findById(groupID);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Add user to group
        if (!group.members.includes(userID)) {
            group.members.push(userID);
            await group.save();
        }

        // Update UserProgress with group information
        await UserProgress.findOneAndUpdate(
            { userID },
            { $push: { groups: groupID } }
        );

        res.json({ message: 'User added to group successfully', group });
    } catch (err) {
        console.error('Error adding user to group:', err);
        res.status(500).send('Internal Server Error');
    }
});

// API to Remove a User from a Group
app.post('/remove-from-group', async (req, res) => {
    const { groupID, userID } = req.body;

    try {
        const group = await Group.findById(groupID);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Remove user from group
        group.members = group.members.filter(member => member !== userID);
        await group.save();

        // Remove group from UserProgress
        await UserProgress.findOneAndUpdate(
            { userID },
            { $pull: { groups: groupID } }
        );

        res.json({ message: 'User removed from group successfully', group });
    } catch (err) {
        console.error('Error removing user from group:', err);
        res.status(500).send('Internal Server Error');
    }
});

// API to Fetch Group by ID
app.get('/group/:groupID', async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupID);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        res.json(group);
    } catch (err) {
        console.error('Error fetching group:', err);
        res.status(500).send('Internal Server Error');
    }
});

// API to Fetch Groups for a User
app.get('/user/groups/:userID', async (req, res) => {
    try {
        const userProgress = await UserProgress.findOne({ userID: req.params.userID }).populate('groups');
        if (!userProgress) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(userProgress.groups);
    } catch (err) {
        console.error('Error fetching user groups:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
