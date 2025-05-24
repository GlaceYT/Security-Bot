const { Schema, model } = require('mongoose');

const logSettingsSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  channels: {
    messageDelete: { type: String, default: null },
    messageUpdate: { type: String, default: null },
    memberJoin: { type: String, default: null },
    memberLeave: { type: String, default: null },
    roleCreate: { type: String, default: null },
    roleDelete: { type: String, default: null },
    memberBan: { type: String, default: null },
    memberUnban: { type: String, default: null },
    voiceJoin: { type: String, default: null },
    voiceLeave: { type: String, default: null },
    channelCreate: { type: String, default: null },
    channelDelete: { type: String, default: null },
    roleAssigned: { type: String, default: null },
    roleRemoved: { type: String, default: null },
    nicknameChange: { type: String, default: null },
    moderationLogs: { type: String, default: null }
  },
  isActive: {
    messageDelete: { type: Boolean, default: false },
    messageUpdate: { type: Boolean, default: false },
    memberJoin: { type: Boolean, default: false },
    memberLeave: { type: Boolean, default: false },
    roleCreate: { type: Boolean, default: false },
    roleDelete: { type: Boolean, default: false },
    memberBan: { type: Boolean, default: false },
    memberUnban: { type: Boolean, default: false },
    voiceJoin: { type: Boolean, default: false },
    voiceLeave: { type: Boolean, default: false },
    channelCreate: { type: Boolean, default: false },
    channelDelete: { type: Boolean, default: false },
    roleAssigned: { type: Boolean, default: false },
    roleRemoved: { type: Boolean, default: false },
    nicknameChange: { type: Boolean, default: false },
    moderationLogs: { type: Boolean, default: false }
  }
});

module.exports = model('LogSettings', logSettingsSchema);
