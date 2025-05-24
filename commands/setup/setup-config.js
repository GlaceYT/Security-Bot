const { SlashCommandBuilder } = require('@discordjs/builders');
const ServerConfig = require('../../models/ServerConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-config')
    .setDescription('Manage co-owners and admins for bot usage.')
    .addSubcommand(subcommand =>
      subcommand.setName('add')
        .setDescription('Add co-owners or admins.')
        .addStringOption(option =>
          option.setName('coowners')
            .setDescription('Comma-separated User IDs of co-owners')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('admins')
            .setDescription('Comma-separated User IDs of admins')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('view')
        .setDescription('View the current co-owners and admins.'))
    .addSubcommand(subcommand =>
      subcommand.setName('remove')
        .setDescription('Remove a co-owner or admin.')
        .addStringOption(option =>
          option.setName('userid')
            .setDescription('User ID to remove')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const serverOwnerId = interaction.guild.ownerId;

    // Ensure only server owner can modify the configuration
    if (interaction.user.id !== serverOwnerId) {
      return interaction.reply('🚫 **Only the server owner can manage the bot configuration.**');
    }

    try {
      let config = await ServerConfig.findOne({ guildId });
      if (!config) {
        config = new ServerConfig({ guildId, coOwners: [], admins: [] });
      }

      if (subcommand === 'add') {
        const coOwners = interaction.options.getString('coowners')?.split(',').map(id => id.trim()) || [];
        const admins = interaction.options.getString('admins')?.split(',').map(id => id.trim()) || [];

        config.coOwners = [...new Set([...config.coOwners, ...coOwners])]; // Avoid duplicates
        config.admins = [...new Set([...config.admins, ...admins])];

        await config.save();
        return interaction.reply(`✅ **Updated Server Configuration!**\n📌 **Co-Owners:** ${config.coOwners.join(', ') || 'None'}\n🔹 **Admins:** ${config.admins.join(', ') || 'None'}`);
      }

      if (subcommand === 'view') {
        return interaction.reply(`📌 **Current Server Configuration:**\n👑 **Co-Owners:** ${config.coOwners.join(', ') || 'None'}\n🔹 **Admins:** ${config.admins.join(', ') || 'None'}`);
      }

      if (subcommand === 'remove') {
        const userId = interaction.options.getString('userid');

        config.coOwners = config.coOwners.filter(id => id !== userId);
        config.admins = config.admins.filter(id => id !== userId);

        await config.save();
        return interaction.reply(`✅ **User <@${userId}> has been removed from server configuration.**`);
      }
    } catch (error) {
      console.error('❌ Error managing server configuration:', error);
      await interaction.reply('⚠️ An error occurred while updating the server configuration.');
    }
  },
};
