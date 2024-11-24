const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user.')
    .addStringOption((option) =>
      option.setName('user-id').setDescription('The ID of the user to unban').setRequired(true)
    ),
  async execute(interaction) {
    const userId = interaction.options.getString('user-id');

    try {
      await interaction.guild.members.unban(userId);
      interaction.reply({ content: `User with ID ${userId} has been unbanned.` });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Failed to unban the user. Ensure the ID is correct.', ephemeral: true });
    }
  },
};
