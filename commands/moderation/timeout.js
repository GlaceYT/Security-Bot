const { SlashCommandBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user for a specified duration.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to timeout').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('duration')
        .setDescription('Duration of the timeout in seconds (1 second to 1000 days)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the timeout').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason');
    const member = interaction.guild.members.cache.get(target.id);

    // Convert duration to milliseconds
    const maxDuration = 1000 * 24 * 60 * 60 * 1000; // 1000 days in milliseconds
    const timeoutDuration = Math.min(duration * 1000, maxDuration);

    if (!member) {
      return interaction.reply({ content: 'User not found in the server!', ephemeral: true });
    }

    if (timeoutDuration <= 0 || timeoutDuration > maxDuration) {
      return interaction.reply({
        content: `Invalid duration. Please provide a value between 1 second and 1000 days.`,
        ephemeral: true,
      });
    }

    try {
      await member.timeout(timeoutDuration, reason);
      const humanReadableDuration = new Date(timeoutDuration).toISOString().substr(11, 8);
      interaction.reply({
        content: `Timed out ${target.tag} for **${humanReadableDuration}**: ${reason}`,
      });

      // Log the infraction in the database
      await Infraction.create({
        userId: target.id,
        guildId: interaction.guild.id,
        moderatorId: interaction.user.id,
        type: 'Timeout',
        reason,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Failed to timeout the user.', ephemeral: true });
    }
  },
};
