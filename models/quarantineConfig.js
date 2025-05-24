const { Schema, model } = require('mongoose');

const quarantineConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    quarantineEnabled: { type: Boolean, default: false },
    quarantineRoleId: { type: String, default: null },
    quarantineChannelId: { type: String, default: null },
    userRoles: { type: Map, of: [String], default: {} }
});

module.exports = model('QuarantineConfig', quarantineConfigSchema);
