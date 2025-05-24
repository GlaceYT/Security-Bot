const LogSettings = require('../models/logSettings');
const { EmbedBuilder } = require('discord.js');

module.exports = function memberBanHandler(client) {
    client.on('guildBanAdd', async (ban) => {
        console.log('🟢 guildBanAdd event triggered'); // Debugging

        if (!ban.guild) return console.log('❌ No guild found for ban.');

        const config = await LogSettings.findOne({ guildId: ban.guild.id });
        if (!config) return console.log('❌ No log settings found for this server.');

        if (!config.isActive.memberBan) {
            return console.log('❌ Logging for memberBan is disabled.');
        }

        const logChannelId = config.channels.memberBan;
        if (!logChannelId) return console.log('❌ No log channel set for memberBan.');

        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        console.log(`✅ Logging member ban in: ${logChannel.id}`);

        const embed = new EmbedBuilder()
            .setTitle('🔨 Member Banned')
            .setColor('#FF0000')
            .addFields(
                { name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: true }
            )
            .setThumbnail(ban.user.displayAvatarURL())
            .setTimestamp();

        try {
    await logChannel.send({ embeds: [embed] });
} catch (error) {
    console.log(`❌ Failed to send log: ${error}`);
}

    });
};
