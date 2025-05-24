const LogSettings = require('../models/logSettings'); // Fixed naming
const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = function channelDeleteHandler(client) {
    client.on('channelDelete', async (channel) => {
        console.log('🟢 channelDelete event triggered'); // Debugging

        if (!channel.guild) return console.log('❌ No guild found for channel.');

        // ✅ Corrected database query
        const config = await LogSettings.findOne({ guildId: channel.guild.id });
        if (!config) return console.log('❌ No log settings found for this server.');

        if (!config.isActive.channelDelete) {
            return console.log('❌ Logging for channelDelete is disabled.');
        }

        const logChannelId = config.channels.channelDelete;
        if (!logChannelId) return console.log('❌ No log channel set for channelDelete.');

        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        console.log(`✅ Logging channel deletion in: ${logChannel.id}`);

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

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Channel Deleted')
            .setColor('#FF0000')
            .addFields(
                { name: 'Channel', value: `${channel.name} (${channel.id})`, inline: true },
                { name: 'Type', value: channelType, inline: true }
            )
            .setTimestamp();

        try {
    await logChannel.send({ embeds: [embed] });
} catch (error) {
    console.log(`❌ Failed to send log: ${error}`);
}

    });
};
