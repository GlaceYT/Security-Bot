const mongoose = require('mongoose');

const UserViolationsSchema = new mongoose.Schema({
  userId: { type: String, required: true }, 
  guildId: { type: String, required: true }, 
  type: { type: String, required: true }, // Type of violation (e.g., 'anti-link', 'anti-spam', 'anti-nuke')
  violations: {
    count: { type: Number, default: 0 }, 
    timestamps: { type: [Number], default: [] }, 
  },
});

module.exports = mongoose.model('UserViolations', UserViolationsSchema);
