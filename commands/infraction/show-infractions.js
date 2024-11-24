const { SlashCommandBuilder } = require('discord.js');
const Infraction = require('../../models/infraction');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('show-infractions')
    .setDescription('Show all infractions for a user.')
    .addUserOption((option) =>
      option.setName('target').setDescription('The user to check').setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');

    try {
      const infractions = await Infraction.find({ 
        userId: target.id, 
        guildId: interaction.guild.id 
      });

      if (!infractions.length) {
        return interaction.reply({ content: `${target.tag} has no infractions.`, ephemeral: true });
      }

      const infractionList = infractions.map((inf, index) => {
        return `**${index + 1}.** Type: ${inf.type}\nReason: ${inf.reason}\nModerator: <@${inf.moderatorId}>\nDate: ${inf.timestamp.toDateString()}`;
      }).join('\n\n');

      interaction.reply({
        content: `Infractions for ${target.tag}:\n\n${infractionList}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Failed to retrieve infractions.', ephemeral: true });
    }
  },
};
