const mongoose = require('mongoose');

const AntiSpamSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  cooldownDuration: { type: Number, default: 5 }, 
  ignoredRoles: { type: [String], default: [] }, 
  activeRoles: { type: [String], default: [] }, 
  ignoredChannels: { type: [String], default: [] }, 
  activeChannels: { type: [String], default: [] },
  logChannelId: { type: String, default: null }, 
  notifyUser: { type: Boolean, default: true },
  notifyModerators: { type: Boolean, default: true }, 
  customMessages: {
    violation: { type: String, default: 'You have violated the anti-spam policy.' },
    timeout: { type: String, default: 'You have been timed out for {duration} minutes due to spamming or using prohibited words.' },
  },
  thresholds: {
    messageLimit: { type: Number, default: 5 }, 
    emojiLimit: { type: Number, default: 10 }, 
  },
  initialTimeoutDuration: { type: Number, default: 600 }, 
  timeoutIncrement: { type: Number, default: 300 }, 
  violationDuration: { type: Number, default: 86400 },
  whitelistWords: { type: [String], default: [] },
  blacklistWords: { type: [String], default: [] }, 
  active: { type: Boolean, default: false }, 
});

module.exports = mongoose.model('AntiSpamSettings', AntiSpamSettingsSchema);
