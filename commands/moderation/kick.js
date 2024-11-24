const { SlashCommandBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to kick').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the kick').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: 'User not found in the server!', ephemeral: true });
    }

    try {
      await member.kick(reason);
      interaction.reply({ content: `Kicked ${target.tag} for: ${reason}` });

      // Log the infraction in the database
      await Infraction.create({
        userId: target.id,
        guildId: interaction.guild.id,
        moderatorId: interaction.user.id,
        type: 'Kick',
        reason,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Failed to kick the user.', ephemeral: true });
    }
  },
};
