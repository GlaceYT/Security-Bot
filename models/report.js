const { Schema, model } = require('mongoose');

const reportSchema = new Schema({
  userId: { type: String, required: true }, // Reported user's ID
  guildId: { type: String, required: true }, // Guild ID where the report occurred
  reporterId: { type: String, required: true }, // ID of the user who reported
  reason: { type: String, required: true }, // Reason for the report
  timestamp: { type: Date, default: Date.now }, // Timestamp of the report
});

module.exports = model('Report', reportSchema);
