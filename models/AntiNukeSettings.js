const mongoose = require('mongoose');

const AntiNukeSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  active: { type: Boolean, default: false },
  logChannelId: { type: String, default: null },
  quarantineRoleId: { type: String, default: null }, 
  thresholds: {
    channelCreate: { type: Number, default: 5 },
    channelDelete: { type: Number, default: 5 },
    roleCreate: { type: Number, default: 5 },
    roleDelete: { type: Number, default: 5 },
    memberKick: { type: Number, default: 5 },
    memberBan: { type: Number, default: 5 },
    memberTimeout: { type: Number, default: 5 },
    warnThreshold: { type: Number, default: 5 },
  },
  thresholds: {
    quarantine: { type: Number, default: 1 }, // Quarantine threshold
    ban: { type: Number, default: 3 }, // Ban threshold
  },
  cooldowns: {
    channelCreate: { type: Number, default: 5000 },
    channelDelete: { type: Number, default: 5000 },
    roleCreate: { type: Number, default: 5000 },
    roleDelete: { type: Number, default: 5000 },
    memberKick: { type: Number, default: 5000 },
    memberBan: { type: Number, default: 5000 },
    memberTimeout: { type: Number, default: 5000 },
    warnThreshold: { type: Number, default: 5000 },
  },
  violationDuration: { type: Number, default: 86400000 }, 
  ignoredRoles: { type: [String], default: [] },
  ignoredMembers: { type: [String], default: [] },
});

module.exports = mongoose.model('AntiNukeSettings', AntiNukeSettingsSchema);
