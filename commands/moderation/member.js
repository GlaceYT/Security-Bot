const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const LogSettings = require('../../models/logSettings'); // Logging settings
const { canUseAdminCommands } = require('../../utils/authCheck');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('member')
        .setDescription('Manage server members.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMembers)
        .addSubcommand(subcommand =>
            subcommand.setName('ban')
                .setDescription('Ban a user from the server.')
                .addUserOption(option => option.setName('target').setDescription('User to ban.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('unban')
                .setDescription('Unban a user via their ID.')
                .addStringOption(option => option.setName('userid').setDescription('User ID to unban.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('kick')
                .setDescription('Kick a user from the server.')
                .addUserOption(option => option.setName('target').setDescription('User to kick.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('timeout')
                .setDescription('Put a user in timeout.')
                .addUserOption(option => option.setName('target').setDescription('User to timeout.').setRequired(true))
                .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('removetimeout')
                .setDescription('Remove timeout from a user.')
                .addUserOption(option => option.setName('target').setDescription('User to remove timeout from.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('nickname')
                .setDescription('Change a user\'s nickname.')
                .addUserOption(option => option.setName('target').setDescription('User to rename.').setRequired(true))
                .addStringOption(option => option.setName('name').setDescription('New nickname.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('warn')
                .setDescription('Warn a user.')
                .addUserOption(option => option.setName('target').setDescription('User to warn.').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason for the warning.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('dm')
                .setDescription('Send a private message to a user.')
                .addUserOption(option => option.setName('target').setDescription('User to message.').setRequired(true))
                .addStringOption(option => option.setName('message').setDescription('Message to send.').setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        const userId = interaction.user.id;
        const guild = interaction.guild;
        if (guild.ownerId !== userId) {
            const hasPermission = await canUseAdminCommands(userId, guild);
            if (!hasPermission) {
              return interaction.reply({ content: '🚫 Only **Admins** or the Server Owner can use this command.', ephemeral: true });
            }
          }
        const logSettings = await LogSettings.findOne({ guildId });
        const logChannelId = logSettings?.channels?.moderationLogs;
        const logChannel = logChannelId ? interaction.guild.channels.cache.get(logChannelId) : null;

        let responseMessage = '';
        let logEmbed = null;

        try {
            if (subcommand === 'ban') {
                const target = interaction.options.getUser('target');
                const member = interaction.guild.members.cache.get(target.id);

                if (!member || !member.bannable) {
                    responseMessage = `❌ Cannot ban **${target.tag}**.`;
                } else {
                    await member.ban();
                    responseMessage = `✅ **${target.tag}** has been banned.`;

                    logEmbed = new EmbedBuilder()
                        .setTitle('🚨 User Banned')
                        .setColor('#FF00FF')
                        .addFields(
                            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                            { name: 'Moderator', value: interaction.user.tag, inline: true }
                        )
                        .setTimestamp();
                }

            } else if (subcommand === 'unban') {
                const userId = interaction.options.getString('userid');

                try {
                    await interaction.guild.members.unban(userId);
                    responseMessage = `✅ Unbanned user with ID **${userId}**.`;

                    logEmbed = new EmbedBuilder()
                        .setTitle('🔓 User Unbanned')
                        .setColor('GREEN')
                        .addFields(
                            { name: 'User ID', value: `${userId}`, inline: true },
                            { name: 'Moderator', value: interaction.user.tag, inline: true }
                        )
                        .setTimestamp();

                } catch {
                    responseMessage = `❌ No user found with ID **${userId}**.`;
                }

            } else if (subcommand === 'kick') {
                const target = interaction.options.getUser('target');
                const member = interaction.guild.members.cache.get(target.id);

                if (!member || !member.kickable) {
                    responseMessage = `❌ Cannot kick **${target.tag}**.`;
                } else {
                    await member.kick();
                    responseMessage = `✅ **${target.tag}** has been kicked.`;

                    logEmbed = new EmbedBuilder()
                        .setTitle('🚨 User Kicked')
                        .setColor('ORANGE')
                        .addFields(
                            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                            { name: 'Moderator', value: interaction.user.tag, inline: true }
                        )
                        .setTimestamp();
                }

            } else if (subcommand === 'timeout') {
                const target = interaction.options.getUser('target');
                const duration = interaction.options.getInteger('duration');
                const member = interaction.guild.members.cache.get(target.id);
            
                if (!member || !member.moderatable) {
                    responseMessage = `❌ Cannot timeout **${target.tag}**.`;
                } else {
                    await member.timeout(duration * 60 * 1000);
                    responseMessage = `✅ **${target.tag}** has been put in timeout for **${duration} minutes**.`;
                }
            
                await interaction.editReply({ content: responseMessage });
            }
            else if (subcommand === 'removetimeout') {
                const target = interaction.options.getUser('target');
                const member = interaction.guild.members.cache.get(target.id);

                if (!member || !member.communicationDisabledUntilTimestamp) {
                    responseMessage = `❌ **${target.tag}** is not in timeout.`;
                } else {
                    await member.timeout(null);
                    responseMessage = `✅ **${target.tag}** timeout has been removed.`;

                    logEmbed = new EmbedBuilder()
                        .setTitle('⏳ Timeout Removed')
                        .setColor('#ff00ff')
                        .addFields(
                            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                            { name: 'Moderator', value: interaction.user.tag, inline: true }
                        )
                        .setTimestamp();
                }

            } else if (subcommand === 'nickname') {
                const target = interaction.options.getUser('target');
                const newName = interaction.options.getString('name');
                const member = interaction.guild.members.cache.get(target.id);

                if (!member || !member.manageable) {
                    responseMessage = `❌ Cannot change nickname for **${target.tag}**.`;
                } else {
                    await member.setNickname(newName);
                    responseMessage = `✅ Changed nickname for **${target.tag}** to **${newName}**.`;

                    logEmbed = new EmbedBuilder()
                        .setTitle('🔤 Nickname Changed')
                        .setColor('PURPLE')
                        .addFields(
                            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                            { name: 'New Nickname', value: newName, inline: true },
                            { name: 'Moderator', value: interaction.user.tag, inline: true }
                        )
                        .setTimestamp();
                }

            } 
            
            
            else if (subcommand === 'dm') {
                const target = interaction.options.getUser('target');
                const message = interaction.options.getString('message');
            
                const dmEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('📩 You have a new message')
                    .setDescription(message)
                    .setFooter({ text: `Sent by ${interaction.user.tag}` });
            
                try {
                    await target.send({ embeds: [dmEmbed] });
                    responseMessage = `✅ DM sent to **${target.tag}**.`;
                } catch {
                    responseMessage = `❌ Could not DM **${target.tag}**. They may have DMs disabled.`;
                }
            
                await interaction.editReply({ content: responseMessage });
            }
            else if (subcommand === 'warn') {
                const target = interaction.options.getUser('target');
                const reason = interaction.options.getString('reason');
                responseMessage = `✅ **${target.tag}** has been warned for **${reason}**.`;

                logEmbed = new EmbedBuilder()
                    .setTitle('⚠️ User Warned')
                    .setColor('YELLOW')
                    .addFields(
                        { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Moderator', value: interaction.user.tag, inline: true }
                    )
                    .setTimestamp();
            }

            await interaction.editReply({ content: responseMessage });

            if (logEmbed && logChannel) {
                await logChannel.send({ embeds: [logEmbed] });
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ An error occurred while processing the command.' });
        }
    }
};
