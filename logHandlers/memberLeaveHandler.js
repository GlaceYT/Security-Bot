const LogSettings = require('../models/logSettings'); // Fixed naming
const { EmbedBuilder } = require('discord.js');

module.exports = function memberLeaveHandler(client) {
    client.on('guildMemberRemove', async (member) => {
        console.log('🟢 guildMemberRemove event triggered'); // Debugging

        if (!member.guild) return console.log('❌ No guild found for member.');

        const config = await LogSettings.findOne({ guildId: member.guild.id });
        if (!config) return console.log('❌ No log settings found for this server.');

        if (!config.isActive.memberLeave) {
            return console.log('❌ Logging for memberLeave is disabled.');
        }

        const logChannelId = config.channels.memberLeave;
        if (!logChannelId) return console.log('❌ No log channel set for memberLeave.');

        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        console.log(`✅ Logging member leave in: ${logChannel.id}`);

        const embed = new EmbedBuilder()
            .setTitle('🚶 Member Left')
            .setColor('#FF9900')
            .addFields(
                { name: 'User', value: `${member.user?.tag || 'Unknown'} (${member.id})`, inline: true },
                { name: 'Left At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setThumbnail(member.user?.displayAvatarURL() || null)
            .setTimestamp();

        try {
    await logChannel.send({ embeds: [embed] });
} catch (error) {
    console.log(`❌ Failed to send log: ${error}`);
}

    });
};
