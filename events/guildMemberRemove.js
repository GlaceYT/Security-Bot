const LogSettings = require('../models/logSettings');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const settings = await LogSettings.findOne({ guildId: member.guild.id });

    if (settings && settings.isActive.leave) {
      const channel = member.guild.channels.cache.get(settings.channels.leave);
      if (channel) {
        channel.send(`👋 <@${member.id}> has left the server.`);
      }
    }
  },
};
