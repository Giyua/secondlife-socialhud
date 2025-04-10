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
    rsvp: [String], // list of RSVPs (usernames)
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
