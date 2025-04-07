// routes/calendar.js

const express = require('express');
const router = express.Router();
const Event = require("../models/event"); // Change Event → event

// Create new event
router.post('/create', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all public events
router.get('/public', async (req, res) => {
  try {
    const events = await Event.find({ isPublic: true }).sort({ date: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invite-only events for a user
router.get('/invited/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const events = await Event.find({ isPublic: false, invitedUsers: username });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;