const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Root endpoint
app.get("/", (req, res) => {
    res.send("Hello, world!");
});

// New /getEvents endpoint
app.get("/getEvents", (req, res) => {
    // Replace this with your actual logic for fetching events
    const events = [
        { title: "Dinner with Friends", time: "2025-04-06T19:00", visibility: "public" },
        { title: "Meeting with Team", time: "2025-04-07T10:00", visibility: "private" }
    ];
    res.status(200).json(events); // Return a JSON response with the events
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
