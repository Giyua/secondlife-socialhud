const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  creator: { type: String, required: true },
  title: { type: String, required: true },
  time: { type: String, required: true }, // Change to `Date` if needed
  visibility: { type: String, enum: ["public", "private"], required: true },
  invited: { type: [String], default: [] },
});

module.exports = mongoose.model("Event", EventSchema);