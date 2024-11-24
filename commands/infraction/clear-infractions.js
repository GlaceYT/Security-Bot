const { SlashCommandBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear-infractions')
    .setDescription('Clear all infractions for a user.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to clear infractions for').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');

    try {
      const result = await Infraction.deleteMany({ 
        userId: target.id, 
        guildId: interaction.guild.id 
      });

      if (result.deletedCount === 0) {
        return interaction.reply({ 
          content: `${target.tag} had no infractions to clear.`, 
          ephemeral: true 
        });
      }

      interaction.reply({
        content: `Cleared ${result.deletedCount} infraction(s) for ${target.tag}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Failed to clear infractions.', ephemeral: true });
    }
  },
};
