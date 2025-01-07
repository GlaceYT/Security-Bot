const { SlashCommandBuilder } = require('discord.js');
const Report = require('../../models/report');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-reports')
    .setDescription('Clear reports for a user.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to clear reports for').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('index')
        .setDescription('The index of the report to clear (optional). Leave blank to clear all.')
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const index = interaction.options.getInteger('index');

    try {
      if (index) {
        const reports = await Report.find({
          userId: target.id,
          guildId: interaction.guild.id,
        });

        if (!reports[index - 1]) {
          return interaction.reply({
            content: `Invalid report index provided.`,
            ephemeral: true,
          });
        }

        const reportToDelete = reports[index - 1];
        await Report.findByIdAndDelete(reportToDelete._id);

        return interaction.reply({
          content: `Successfully cleared report #${index} for ${target.tag}.`,
          ephemeral: true,
        });
      } else {
        const result = await Report.deleteMany({
          userId: target.id,
          guildId: interaction.guild.id,
        });

        if (result.deletedCount === 0) {
          return interaction.reply({
            content: `${target.tag} had no reports to clear.`,
            ephemeral: true,
          });
        }

        interaction.reply({
          content: `Cleared all reports (${result.deletedCount}) for ${target.tag}.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: 'Failed to clear reports. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
