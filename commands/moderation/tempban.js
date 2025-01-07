const { SlashCommandBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Temporarily ban a user for a specified duration.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to temporarily ban').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('duration')
        .setDescription('Duration of the ban in days')
        .setRequired(true)
        .addChoices(
          { name: '1 day', value: 1 },
          { name: '3 days', value: 3 },
          { name: '7 days', value: 7 },
          { name: '30 days', value: 30 }
        )
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the temporary ban').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason');
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: 'User not found in the server!', ephemeral: true });
    }

    try {
      await member.ban({ reason });
      interaction.reply({ content: `Temporarily banned ${target.tag} for ${duration} days: ${reason}` });

      // Schedule unban
      setTimeout(async () => {
        try {
          await interaction.guild.members.unban(target.id);
          console.log(`User ${target.tag} was unbanned after ${duration} days.`);
        } catch (error) {
          console.error(`Failed to unban ${target.tag}:`, error);
        }
      }, duration * 24 * 60 * 60 * 1000);

      // Log the infraction in the database
      await Infraction.create({
        userId: target.id,
        guildId: interaction.guild.id,
        moderatorId: interaction.user.id,
        type: 'Tempban',
        reason,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Failed to temporarily ban the user.', ephemeral: true });
    }
  },
};
