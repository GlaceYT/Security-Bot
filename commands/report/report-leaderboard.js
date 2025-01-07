const { SlashCommandBuilder } = require('discord.js');
const Report = require('../../models/report');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report-leaderboard')
    .setDescription('Show the leaderboard of users with the highest reports.'),
  async execute(interaction) {
    try {
      const reportCounts = await Report.aggregate([
        { $match: { guildId: interaction.guild.id } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, 
      ]);

      if (!reportCounts.length) {
        return interaction.reply({
          content: 'No reports have been filed in this server.',
          ephemeral: true,
        });
      }

      const leaderboard = reportCounts.map((entry, index) => {
        return `**${index + 1}.** <@${entry._id}> - ${entry.count} reports`;
      }).join('\n');

      interaction.reply({
        content: `📋 **Report Leaderboard**:\n\n${leaderboard}`,
        ephemeral: false,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: 'Failed to fetch the report leaderboard.',
        ephemeral: true,
      });
    }
  },
};
