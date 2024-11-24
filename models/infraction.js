const { Schema, model } = require('mongoose');

const infractionSchema = new Schema({
  userId: { type: String, required: true }, 
  guildId: { type: String, required: true },
  moderatorId: { type: String, required: true }, 
  type: { type: String, required: true }, 
  reason: { type: String, required: true }, 
  timestamp: { type: Date, default: Date.now }, 
});

module.exports = model('Infraction', infractionSchema);
