const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// GET notifications for a user
router.get("/:user_id", async (req, res) => {
  try {
    const notifs = await Notification.find({ user_id: req.params.user_id });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new notification
router.post("/", async (req, res) => {
  try {
    const notif = new Notification(req.body);
    await notif.save();
    res.status(201).json(notif);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark a notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
