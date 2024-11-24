const { SlashCommandBuilder } = require('discord.js');
const Report = require('../../models/report');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('show-reports')
    .setDescription('Show all reports for a user.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to show reports for').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');

    try {
      const reports = await Report.find({
        userId: target.id,
        guildId: interaction.guild.id,
      });

      if (!reports.length) {
        return interaction.reply({
          content: `${target.tag} has no reports.`,
          ephemeral: true,
        });
      }

      const reportList = reports.map((report, index) => {
        return `**${index + 1}.** Reported by: <@${report.reporterId}>\nReason: ${report.reason}\nDate: ${report.timestamp.toDateString()}`;
      }).join('\n\n');

      interaction.reply({
        content: `Reports for ${target.tag}:\n\n${reportList}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: 'Failed to retrieve reports.',
        ephemeral: true,
      });
    }
  },
};
