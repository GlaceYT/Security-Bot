const { SlashCommandBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('temptimeout')
    .setDescription('Temporarily timeout a user for a specified duration.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to timeout').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('duration')
        .setDescription('Duration of the timeout')
        .setRequired(true)
        .addChoices(
          { name: '5 minutes', value: 5 * 60 },
          { name: '10 minutes', value: 10 * 60 },
          { name: '30 minutes', value: 30 * 60 },
          { name: '1 hour', value: 60 * 60 }
        )
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the timeout').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const duration = interaction.options.getInteger('duration') * 1000; // Convert to milliseconds
    const reason = interaction.options.getString('reason');
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: 'User not found in the server!', ephemeral: true });
    }

    try {
      await member.timeout(duration, reason);
      interaction.reply({
        content: `Timed out ${target.tag} for **${duration / 1000 / 60} minutes**: ${reason}`,
      });

      // Log the infraction in the database
      await Infraction.create({
        userId: target.id,
        guildId: interaction.guild.id,
        moderatorId: interaction.user.id,
        type: 'TempTimeout',
        reason,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Failed to timeout the user.', ephemeral: true });
    }
  },
};
