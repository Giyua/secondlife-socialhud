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
// Rest of your code (e.g., routes, server startup, etc.)


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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
