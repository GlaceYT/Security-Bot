const { Schema, model } = require('mongoose');

const userQuarantineSchema = new Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    isQuarantined: { type: Boolean, default: true }, // Track if user is currently quarantined
    quarantinedAt: { type: Date, default: Date.now }
});

module.exports = model('UserQuarantine', userQuarantineSchema);
