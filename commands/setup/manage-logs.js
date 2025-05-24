const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const LogSettings = require('../../models/logSettings');
const { canUseCoOwnerCommands } = require('../../utils/authCheck');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('manage-logs')
    .setDescription('Remove or view logging configurations for a specific or all events.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('event')
        .setDescription('Remove logging configuration for a specific event.')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('The type of logs to remove.')
            .setRequired(true)
            .addChoices(
              { name: 'Message Deleted', value: 'messageDelete' },
              { name: 'Message Updated', value: 'messageUpdate' },
              { name: 'Member Joined', value: 'memberJoin' },
              { name: 'Member Left', value: 'memberLeave' },
              { name: 'Role Created', value: 'roleCreate' },
              { name: 'Role Deleted', value: 'roleDelete' },
              { name: 'Member Banned', value: 'memberBan' },
              { name: 'Member Unbanned', value: 'memberUnban' },
              { name: 'Voice Channel Joined', value: 'voiceJoin' },
              { name: 'Voice Channel Left', value: 'voiceLeave' },
              { name: 'Channel Created', value: 'channelCreate' },
              { name: 'Channel Deleted', value: 'channelDelete' },
              { name: 'Role Assigned to User', value: 'roleAssigned' },
              { name: 'Role Removed from User', value: 'roleRemoved' },
              { name: 'Nickname Changed', value: 'nicknameChange' },
              { name: 'Moderation Logs', value: 'moderationLogs' }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('all').setDescription('Remove all logging configurations.')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('view').setDescription('View current logging configurations.')
    ),

  async execute(interaction) {
 
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    
    const userId = interaction.user.id;
    const guild = interaction.guild;
    if (guild.ownerId !== userId) {
      const hasPermission = await canUseCoOwnerCommands(userId, guild);
      if (!hasPermission) {
        return interaction.reply({ content: '🚫 Only **Co-Owners** or the Server Owner can use this command.', ephemeral: true });
      }
    }

    if (subcommand === 'event') {
      const eventType = interaction.options.getString('type');

      try {
        const settings = await LogSettings.findOne({ guildId });

        if (!settings) {
          return interaction.reply({ content: 'No log settings found for this server.', ephemeral: true });
        }

        // Remove the event's logging configuration
        settings.isActive[eventType] = false;
        settings.channels[eventType] = null;

        await settings.save();

        return interaction.reply({ content: `Removed logging configuration for **${eventType}**.`, ephemeral: true });
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'Failed to remove the log settings.', ephemeral: true });
      }
    }

    if (subcommand === 'all') {
      try {
        const settings = await LogSettings.findOne({ guildId });

        if (!settings) {
          return interaction.reply({ content: 'No log settings found for this server.', ephemeral: true });
        }

        // Reset all log settings
        Object.keys(settings.isActive).forEach((event) => {
          settings.isActive[event] = false;
          settings.channels[event] = null;
        });

        await settings.save();

        return interaction.reply({ content: 'All logging configurations have been removed.', ephemeral: true });
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'Failed to remove all log settings.', ephemeral: true });
      }
    }

    if (subcommand === 'view') {
      try {
        const settings = await LogSettings.findOne({ guildId });

        if (!settings) {
          return interaction.reply({ content: 'No logging channels have been configured yet.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setTitle('Configured Logging Channels')
          .setColor('#00FFFF');

        let hasLogs = false;
        Object.entries(settings.channels).forEach(([event, channelId]) => {
          if (channelId) {
            embed.addFields({ name: event, value: `<#${channelId}>`, inline: true });
            hasLogs = true;
          }
        });

        if (!hasLogs) {
          return interaction.reply({ content: 'No active logging configurations found.', ephemeral: true });
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'Failed to retrieve log settings.', ephemeral: true });
      }
    }
  }
};
