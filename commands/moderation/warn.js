const { SlashCommandBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to warn').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the warning').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    try {
      await interaction.reply({ content: `${target.tag} has been warned for: ${reason}` });

      // Log the infraction in the database
      await Infraction.create({
        userId: target.id,
        guildId: interaction.guild.id,
        moderatorId: interaction.user.id,
        type: 'Warn',
        reason,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Failed to warn the user.', ephemeral: true });
    }
  },
};
