const { SlashCommandBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the ban').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: 'User not found in the server!', ephemeral: true });
    }

    try {
      await member.ban({ reason });
      interaction.reply({ content: `Banned ${target.tag} for: ${reason}` });

      // Log the infraction in the database
      await Infraction.create({
        userId: target.id,
        guildId: interaction.guild.id,
        moderatorId: interaction.user.id,
        type: 'Ban',
        reason,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Failed to ban the user.', ephemeral: true });
    }
  },
};
