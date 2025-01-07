const { Schema, model } = require('mongoose');

const reportSchema = new Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true }, 
  reporterId: { type: String, required: true }, 
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }, 
});

module.exports = model('Report', reportSchema);
