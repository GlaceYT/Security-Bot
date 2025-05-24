const mongoose = require('mongoose');

const AntiLinkSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  cooldownDuration: { type: Number, default: 60 }, // in seconds
  ignoredRoles: { type: [String], default: [] },
  activeRoles: { type: [String], default: [] },
  ignoredChannels: { type: [String], default: [] },
  activeChannels: { type: [String], default: [] },
  logChannelId: { type: String, default: null },
  notifyUser: { type: Boolean, default: true },
  notifyModerators: { type: Boolean, default: true },
  customMessages: {
    violation: { type: String, default: 'You have violated the anti-link policy.' },
    punishment: { type: String, default: 'You have been {punishment} for violating the anti-link policy.' },
  },
  thresholds: {
    warn: { type: Number, default: 3 },
    timeout: { type: Number, default: 5 },
    kick: { type: Number, default: 10 },
    ban: { type: Number, default: 15 },
  },
  punishmentType: { type: String, enum: ['warn', 'timeout', 'kick', 'ban'], default: 'warn' },
  punishmentDuration: { type: Number, default: 0 },
  logDetails: { type: Boolean, default: true },
  notifyMembers: { type: Boolean, default: true },
  actionMessage: { type: String, default: 'Action taken against {user}: {punishment}' },
  violationMessage: { type: String, default: 'You have violated the anti-link policy.' },
  active: { type: Boolean, default: false },
  timeoutDurations: { type: Number, default: 600000 },
  violationDuration: { type: Number, default: 86400000 },
  whitelistLinks: { type: [String], default: [] }, 
  blacklistLinks: { type: [String], default: [] }, 
});

module.exports = mongoose.model('AntiLinkSettings', AntiLinkSettingsSchema);
