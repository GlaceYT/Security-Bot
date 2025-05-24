const mongoose = require('mongoose');

const AntiNukeSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  active: { type: Boolean, default: false }, // ON or OFF
});

module.exports = mongoose.model('AntiNukeSettings', AntiNukeSettingsSchema);
