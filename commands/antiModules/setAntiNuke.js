const { SlashCommandBuilder } = require('@discordjs/builders');
const AntiNukeSettings = require('../../models/AntiNukeSettings');
const { canUseCoOwnerCommands } = require('../../utils/authCheck');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('Toggle the Anti-Nuke System On/Off')
    .addBooleanOption(option =>
      option.setName('status')
        .setDescription('Enable or disable the Anti-Nuke system')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const guildId = interaction.guild.id;
      const status = interaction.options.getBoolean('status');
      const userId = interaction.user.id;
      const guild = interaction.guild;
  
      // ✅ Allow Server Owner to Use Command
      if (guild.ownerId !== userId) {
        const hasPermission = await canUseCoOwnerCommands(userId, guildId);
        if (!hasPermission) {
          return interaction.reply({ content: '🚫 Only **Co-Owners** or the Server Owner can use this command.', ephemeral: true });
        }
      }
      let settings = await AntiNukeSettings.findOne({ guildId });
      if (!settings) {
        settings = new AntiNukeSettings({ guildId });
      }

      settings.active = status;
      await settings.save();

      await interaction.reply(`✅ **Anti-Nuke System is now ${status ? 'ENABLED' : 'DISABLED'}**!`);
    } catch (error) {
      console.error('❌ Error toggling Anti-Nuke:', error);
      await interaction.reply('⚠️ An error occurred while updating the Anti-Nuke settings.');
    }
  },
};
