const { Schema, model } = require('mongoose');

const verificationConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    verificationEnabled: { type: Boolean, default: false },
    unverifiedRoleId: { type: String, default: null },
    verifiedRoleId: { type: String, default: null },
    verificationChannelId: { type: String, default: null }
});

module.exports = model('VerificationConfig', verificationConfigSchema);
