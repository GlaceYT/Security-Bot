const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const LogSettings = require('../../models/logSettings');
const { canUseCoOwnerCommands } = require('../../utils/authCheck');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Configure server logging channels for specific or all events.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('event')
                .setDescription('Set a logging channel for a specific event.')
                .addStringOption(option =>
                    option.setName('event')
                        .setDescription('The event to log.')
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
                            { name: 'Moderation Logs', value: 'moderationLogs' },
                        ))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to log the event in.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('Set a logging channel for all events.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to log all events in.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View all configured logging channels.')),

    async execute(interaction) {

        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;
        const userId = interaction.user.id;
    
        // ✅ Allow Server Owner to Use Command
        if (guild.ownerId !== userId) {
            const hasPermission = await canUseCoOwnerCommands(userId, guild);
          if (!hasPermission) {
            return interaction.reply({ content: '🚫 Only **Co-Owners** or the Server Owner can use this command.', ephemeral: true });
          }
        }
        if (subcommand === 'event') {
            const eventType = interaction.options.getString('event');
            const channel = interaction.options.getChannel('channel');

            if (!channel.isTextBased()) {
                return interaction.reply({ content: 'Please select a text-based channel.', ephemeral: true });
            }

            // Update or create log settings for the specific event
            await LogSettings.findOneAndUpdate(
                { guildId },
                { $set: { [`channels.${eventType}`]: channel.id, [`isActive.${eventType}`]: true } },
                { upsert: true, new: true }
            );

            return interaction.reply({ content: `Logs for **${eventType}** will now be sent to <#${channel.id}>.`, ephemeral: true });
        }

        if (subcommand === 'all') {
            const channel = interaction.options.getChannel('channel');

            if (!channel.isTextBased()) {
                return interaction.reply({ content: 'Please select a text-based channel.', ephemeral: true });
            }

            const updateFields = {};
            const eventTypes = [
                'messageDelete', 'messageUpdate', 'memberJoin', 'memberLeave',
                'roleCreate', 'roleDelete', 'memberBan', 'memberUnban',
                'voiceJoin', 'voiceLeave', 'channelCreate', 'channelDelete',
                'roleAssigned', 'roleRemoved', 'nicknameChange', 'moderationLogs'
            ];

            for (const eventType of eventTypes) {
                updateFields[`channels.${eventType}`] = channel.id;
                updateFields[`isActive.${eventType}`] = true;
            }

            await LogSettings.findOneAndUpdate(
                { guildId },
                { $set: updateFields },
                { upsert: true, new: true }
            );

            return interaction.reply({ content: `Logs for all events will now be sent to <#${channel.id}>.`, ephemeral: true });
        }

        if (subcommand === 'view') {
            const config = await LogSettings.findOne({ guildId });

            if (!config) {
                return interaction.reply({ content: 'No logging channels have been configured yet.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Configured Logging Channels')
                .setColor('#00FFFF');

            Object.entries(config.channels).forEach(([event, channelId]) => {
                if (channelId) {
                    embed.addFields({ name: event, value: `<#${channelId}>`, inline: true });
                }
            });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
