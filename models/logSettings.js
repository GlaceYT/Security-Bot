const { Schema, model } = require('mongoose');

const logSettingsSchema = new Schema({
  guildId: { type: String, required: true },
  channels: {
    welcome: { type: String, default: null },
    leave: { type: String, default: null },
    edit: { type: String, default: null },
    delete: { type: String, default: null },
    roleUpdate: { type: String, default: null },
  },
  isActive: {
    welcome: { type: Boolean, default: false },
    leave: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    roleUpdate: { type: Boolean, default: false }, 
  },
});

module.exports = model('LogSettings', logSettingsSchema);
