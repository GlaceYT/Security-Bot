const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removetimeout')
    .setDescription('Remove a user\'s timeout.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to remove the timeout from').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: 'User not found in the server!', ephemeral: true });
    }

    try {
      await member.timeout(null);
      interaction.reply({ content: `Timeout removed for ${target.tag}.` });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Failed to remove the timeout.', ephemeral: true });
    }
  },
};
