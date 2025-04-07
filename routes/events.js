const express = require("express");
const router = express.Router();
const Event = require("../models/event");

// POST /createEvent
router.post("/createEvent", async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.status(200).json({ message: "✅ Event created!" });
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ error: "Server error while creating event." });
  }
});

// GET /getEvents
router.get("/getEvents", async (req, res) => {
  try {
    const events = await Event.find().sort({ time: 1 });
    res.status(200).json(events);
  } catch (err) {
    console.error("Get vents Error:", err);
    res.status(500).json({ error: "Server error while fetching events." });
  }
});

module.exports = router;