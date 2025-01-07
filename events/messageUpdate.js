const LogSettings = require('../models/logSettings');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (oldMessage.author.bot) return;

    const settings = await LogSettings.findOne({ guildId: oldMessage.guild.id });

    if (settings && settings.isActive.edit) {
      const channel = oldMessage.guild.channels.cache.get(settings.channels.edit);
      if (channel) {
        channel.send(
          `✏️ **Message Edited**:\nAuthor: <@${oldMessage.author.id}>\nChannel: <#${oldMessage.channel.id}>\nOld: ${oldMessage.content}\nNew: ${newMessage.content}`
        );
      }
    }
  },
};
