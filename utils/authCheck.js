const ServerConfig = require('../models/ServerConfig');

async function isServerOwner(userId, guild) {
  return guild.ownerId === userId; // Directly checks if the user is the server owner
}

async function canUseCoOwnerCommands(userId, guild) {
  if (await isServerOwner(userId, guild)) return true; // Always allow the owner

  const config = await ServerConfig.findOne({ guildId: guild.id });
  if (!config) return false;
  return config.coOwners.includes(userId);
}

async function canUseAdminCommands(userId, guild) {
  if (await isServerOwner(userId, guild)) return true; // Always allow the owner

  const config = await ServerConfig.findOne({ guildId: guild.id });
  if (!config) return false;
  return config.coOwners.includes(userId) || config.admins.includes(userId);
}

module.exports = {
  canUseCoOwnerCommands,
  canUseAdminCommands
};
