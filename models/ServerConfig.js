const mongoose = require('mongoose');

const ServerConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  coOwners: { type: [String], default: [] }, // Array of Co-Owner User IDs
  admins: { type: [String], default: [] }, // Array of Admin User IDs
});

module.exports = mongoose.model('ServerConfig', ServerConfigSchema);
