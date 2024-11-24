const { SlashCommandBuilder } = require('discord.js');
const LogSettings = require('../../models/logSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('show-logs')
    .setDescription('Show the current log settings for the server.'),
  async execute(interaction) {
    try {
      const settings = await LogSettings.findOne({ guildId: interaction.guild.id });

      if (!settings) {
        return interaction.reply({
          content: 'No log settings found for this server.',
          ephemeral: true,
        });
      }

      const logDetails = Object.keys(settings.isActive)
        .map((type) => {
          const channelId = settings.channels[type];
          const isActive = settings.isActive[type];
          return `**${type.charAt(0).toUpperCase() + type.slice(1)} Logs**:\nActive: **${isActive}**\nChannel: ${
            channelId ? `<#${channelId}>` : 'Not set'
          }\n`;
        })
        .join('\n');

      interaction.reply({
        content: `**Log Settings for this Server:**\n\n${logDetails}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: 'Failed to retrieve the log settings.',
        ephemeral: true,
      });
    }
  },
};
