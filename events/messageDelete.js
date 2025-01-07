const LogSettings = require('../models/logSettings');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (message.author.bot) return;

    const settings = await LogSettings.findOne({ guildId: message.guild.id });

    if (settings && settings.isActive.delete) {
      const channel = message.guild.channels.cache.get(settings.channels.delete);
      if (channel) {
        channel.send(
          `🗑️ **Message Deleted**:\nAuthor: <@${message.author.id}>\nChannel: <#${message.channel.id}>\nContent: ${message.content}`
        );
      }
    }
  },
};
