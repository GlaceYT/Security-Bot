const LogSettings = require('../models/logSettings'); // Corrected naming
const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = function channelCreateHandler(client) {
    client.on('channelCreate', async (channel) => {
        console.log('🟢 channelCreate event triggered'); // Debugging

        if (!channel.guild) return console.log('❌ No guild found for channel.');

        // ✅ Corrected database query
        const config = await LogSettings.findOne({ guildId: channel.guild.id });
        if (!config) return console.log('❌ No log settings found for this server.');

        if (!config.isActive.channelCreate) {
            return console.log('❌ Logging for channelCreate is disabled.');
        }

        const logChannelId = config.channels.channelCreate;
        if (!logChannelId) return console.log('❌ No log channel set for channelCreate.');

        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        console.log(`✅ Logging channel creation in: ${logChannel.id}`);

        // 🔥 Channel Type Mapping
        const channelType = {
            [ChannelType.GuildText]: 'Text Channel',
            [ChannelType.GuildVoice]: 'Voice Channel',
            [ChannelType.GuildCategory]: 'Category',
            [ChannelType.GuildAnnouncement]: 'Announcement Channel',
            [ChannelType.GuildStageVoice]: 'Stage Channel',
            [ChannelType.GuildForum]: 'Forum Channel',
            [ChannelType.PublicThread]: 'Public Thread',
            [ChannelType.PrivateThread]: 'Private Thread',
            [ChannelType.GuildDirectory]: 'Directory Channel',
        }[channel.type] || 'Unknown Type';

        // 📢 Creating Embed
        const embed = new EmbedBuilder()
            .setTitle('📢 Channel Created')
            .setColor('#00FF00')
            .addFields(
                { name: 'Channel', value: `${channel.name} (${channel.id})`, inline: true },
                { name: 'Type', value: channelType, inline: true }
            )
            .setTimestamp();

        // 🚀 Send log
        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.log(`❌ Failed to send log: ${error}`);
        }
        
    });
};
