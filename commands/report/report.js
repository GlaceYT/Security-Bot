const { SlashCommandBuilder } = require('discord.js');
const Report = require('../../models/report');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user for misconduct.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to report').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the report').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    try {
      await Report.create({
        userId: target.id,
        guildId: interaction.guild.id,
        reporterId: interaction.user.id,
        reason,
      });

      interaction.reply({
        content: `Successfully reported ${target.tag} for: ${reason}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: 'Failed to file the report. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
