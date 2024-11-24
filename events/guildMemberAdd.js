const LogSettings = require('../models/logSettings');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const settings = await LogSettings.findOne({ guildId: member.guild.id });

    if (settings && settings.isActive.welcome) {
      const channel = member.guild.channels.cache.get(settings.channels.welcome);
      if (channel) {
        channel.send(`🎉 Welcome <@${member.id}> to the server!`);
      }
    }
  },
};
