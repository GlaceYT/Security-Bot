const { SlashCommandBuilder } = require('@discordjs/builders');
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Get server-related information.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Show detailed server information with pagination.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('icon')
                .setDescription('Show the server icon.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('banner')
                .setDescription('Show the server banner.')
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const server = interaction.guild;
        if (!server) return interaction.editReply('❌ Unable to retrieve server information.');

        // Check which subcommand was used
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'info') {
            try {
                const owner = await server.fetchOwner();
                const emojis = server.emojis.cache;
                const roles = server.roles.cache.filter(role => role.id !== server.id);
                const channels = server.channels.cache;

                const textChannels = channels.filter(channel => channel.type === ChannelType.GuildText).size;
                const voiceChannels = channels.filter(channel => channel.type === ChannelType.GuildVoice).size;
                const categories = channels.filter(channel => channel.type === ChannelType.GuildCategory).size;
                const stageChannels = channels.filter(channel => channel.type === ChannelType.GuildStageVoice).size;
                const totalChannels = textChannels + voiceChannels + stageChannels + categories;

                const boostCount = server.premiumSubscriptionCount || 0;
                const boostLevel = server.premiumTier || 0;

                // **Embed Pages**
                const embeds = [
                    new EmbedBuilder()
                        .setColor('#FFFFFF')
                        .setAuthor({ name: 'Server Info', iconURL: server.iconURL({ dynamic: true }) })
                        .setThumbnail(server.iconURL({ dynamic: true, size: 1024 }))
                        .addFields([
                            { name: '📛 Server Name', value: `\`${server.name}\``, inline: true },
                            { name: '👑 Owner', value: `<@${owner.id}>`, inline: true },
                            { name: '🆔 Server ID', value: `\`${server.id}\``, inline: true },
                            { name: '👥 Members', value: `\`${server.memberCount}\``, inline: true },
                            { name: '🤖 Bots', value: `\`${server.members.cache.filter(m => m.user.bot).size}\``, inline: true },
                            { name: '🚀 Boosts', value: `\`${boostCount} (Level ${boostLevel})\``, inline: true },
                            { name: '📂 Categories', value: `\`${categories}\``, inline: true },
                            { name: '💬 Text Channels', value: `\`${textChannels}\``, inline: true },
                            { name: '🔊 Voice Channels', value: `\`${voiceChannels}\``, inline: true },
                            { name: '🎭 Roles', value: `\`${roles.size}\``, inline: true },
                            { name: '😀 Emojis', value: `\`${emojis.size}\``, inline: true },
                            { name: '🆕 Created On', value: `<t:${Math.floor(server.createdTimestamp / 1000)}:F>`, inline: false },
                        ])
                        .setTimestamp(),

                    new EmbedBuilder()
                        .setColor('#FFFFFF')
                        .setTitle('🎭 Roles')
                        .setDescription(roles.size > 0 ? roles.map(role => `<@&${role.id}>`).join(', ') : 'No roles available.'),

                    new EmbedBuilder()
                        .setColor('#FFFFFF')
                        .setTitle('😀 Emojis')
                        .setDescription(emojis.size > 0 ? emojis.map(e => e.toString()).join(' ') : 'No emojis available.'),
                ];

                // **Pagination Buttons**
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('previous').setLabel('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId('next').setLabel('➡️').setStyle(ButtonStyle.Secondary)
                );

                let currentPage = 0;
                await interaction.editReply({ embeds: [embeds[currentPage]], components: [row] });

                const filter = i => ['previous', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async i => {
                    if (i.customId === 'previous') currentPage--;
                    if (i.customId === 'next') currentPage++;

                    row.components[0].setDisabled(currentPage === 0);
                    row.components[1].setDisabled(currentPage === embeds.length - 1);

                    await i.update({ embeds: [embeds[currentPage]], components: [row] });
                });

                collector.on('end', async () => {
                    try {
                        await interaction.editReply({ components: [] });
                    } catch (err) {
                        console.error('Failed to remove buttons after collector ended:', err);
                    }
                });

            } catch (error) {
                console.error('Error fetching server information:', error);
                return interaction.editReply({ content: '❌ Error fetching server information.' });
            }
        } 
        else if (subcommand === 'icon') {
            // Create an embed with the server icon
            const iconURL = server.iconURL({ format: 'png', dynamic: true, size: 1024 });
            const embed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setTitle('🖼 Server Icon')
                .setImage(iconURL)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } 
        else if (subcommand === 'banner') {
            // Create an embed with the server banner (if available)
            const bannerURL = server.bannerURL({ format: 'png', dynamic: true, size: 1024 });
            if (!bannerURL) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription('❌ This server does not have a banner.');
                return await interaction.editReply({ embeds: [embed] });
            }
            const embed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setTitle('🏞 Server Banner')
                .setImage(bannerURL)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
