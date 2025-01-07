const { SlashCommandBuilder } = require('discord.js');
const LogSettings = require('../../models/logSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-logs')
    .setDescription('Remove logging configuration for a specific type.')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('The type of logs to remove (e.g., welcome, leave, edit, delete, roleupdate).')
        .setRequired(true)
        .addChoices(
          { name: 'Welcome', value: 'welcome' },
          { name: 'Leave', value: 'leave' },
          { name: 'Edit', value: 'edit' },
          { name: 'Delete', value: 'delete' },
          { name: 'Role Update', value: 'roleupdate' }
        )
    ),
  async execute(interaction) {
    const type = interaction.options.getString('type');

    try {
      const settings = await LogSettings.findOne({ guildId: interaction.guild.id });

      if (!settings) {
        return interaction.reply({
          content: 'No log settings found for this server.',
          ephemeral: true,
        });
      }

      const typeKey = type === 'roleupdate' ? 'roleUpdate' : type;

      settings.isActive[typeKey] = false;
      settings.channels[typeKey] = null;

      await settings.save();

      interaction.reply({
        content: `Removed logging configuration for **${typeKey}**.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: 'Failed to remove the log settings.',
        ephemeral: true,
      });
    }
  },
};
