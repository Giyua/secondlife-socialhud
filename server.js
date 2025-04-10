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

// Schemas and Models
const eventSchema = new mongoose.Schema({
    name: String,
    date: Date,
    time: String,
    location: String,
    type: String,
    rsvp: [String]
});
const Event = mongoose.model('Event', eventSchema);

const checkInSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    location: { type: String, required: true },
    companions: { type: [String], default: [] },
    socialPoints: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
});
const CheckIn = mongoose.model('CheckIn', checkInSchema);

const achievementSchema = new mongoose.Schema({
    name: { type: String, required: true },
    criteria: { type: Object, required: true },
    reward: { type: Object, required: true }
});
const Achievement = mongoose.model('Achievement', achievementSchema);

const favoriteSchema = new mongoose.Schema({
    title: { type: String },
    url: { type: String, required: true },
    addedAt: { type: Date, default: Date.now }
});

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
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Group',
        default: []
    }
});
const UserProgress = mongoose.model('UserProgress', userProgressSchema);

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    members: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});
const Group = mongoose.model('Group', groupSchema);

const notificationSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});
const Notification = mongoose.model('Notification', notificationSchema);

const friendshipSchema = new mongoose.Schema({
    userA: String,
    userB: String,
    score: { type: Number, default: 0 },
    lastInteraction: { type: Date, default: Date.now }
});
const Friendship = mongoose.model('Friendship', friendshipSchema);

// Routes

// Group APIs
app.post('/create-group', async (req, res) => {
    const { name, description, members } = req.body;
    try {
        const newGroup = new Group({ name, description, members });
        await newGroup.save();

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

app.post('/add-to-group', async (req, res) => {
    const { groupID, userID } = req.body;

    try {
        const group = await Group.findById(groupID);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!group.members.includes(userID)) {
            group.members.push(userID);
            await group.save();
        }

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

app.post('/remove-from-group', async (req, res) => {
    const { groupID, userID } = req.body;

    try {
        const group = await Group.findById(groupID);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        group.members = group.members.filter(member => member !== userID);
        await group.save();

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

app.get('/group/:groupID', async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupID);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.json(group);
    } catch (err) {
        console.error('Error fetching group:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/user/groups/:userID', async (req, res) => {
    try {
        const userProgress = await UserProgress.findOne({ userID: req.params.userID }).populate('groups');
        if (!userProgress) return res.status(404).json({ message: 'User not found' });
        res.json(userProgress.groups);
    } catch (err) {
        console.error('Error fetching user groups:', err);
        res.status(500).send('Internal Server Error');
    }
});

// New Routes: Check-ins, Achievements, Friendships

app.post('/checkin', async (req, res) => {
    const { userID, location, companions = [], socialPoints = 0 } = req.body;
    try {
        const checkIn = new CheckIn({ userID, location, companions, socialPoints });
        await checkIn.save();
        res.status(201).json({ message: "Check-in successful!", checkIn });
    } catch (err) {
        console.error("Check-in error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/unlock-achievement', async (req, res) => {
    const { userID, achievementName } = req.body;
    try {
        await UserProgress.findOneAndUpdate(
            { userID },
            { $addToSet: { achievements: achievementName } }
        );
        res.json({ message: "Achievement unlocked!" });
    } catch (err) {
        console.error("Error unlocking achievement:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/update-friendship', async (req, res) => {
    const { userA, userB, scoreChange = 1 } = req.body;
    try {
        const friendship = await Friendship.findOneAndUpdate(
            { userA, userB },
            { $inc: { score: scoreChange }, $set: { lastInteraction: new Date() } },
            { upsert: true, new: true }
        );
        res.json({ message: "Friendship updated", friendship });
    } catch (err) {
        console.error("Error updating friendship:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
