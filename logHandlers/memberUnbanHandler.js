const LogSettings = require('../models/logSettings');
const { EmbedBuilder } = require('discord.js');

module.exports = function memberUnbanHandler(client) {
    client.on('guildBanRemove', async (ban) => {
        console.log('🟢 guildBanRemove event triggered'); // Debugging

        if (!ban.guild) return console.log('❌ No guild found for unban.');

        const config = await LogSettings.findOne({ guildId: ban.guild.id });
        if (!config) return console.log('❌ No log settings found for this server.');

        if (!config.isActive.memberUnban) {
            return console.log('❌ Logging for memberUnban is disabled.');
        }

        const logChannelId = config.channels.memberUnban;
        if (!logChannelId) return console.log('❌ No log channel set for memberUnban.');

        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        console.log(`✅ Logging member unban in: ${logChannel.id}`);

        const embed = new EmbedBuilder()
            .setTitle('🔓 Member Unbanned')
            .setColor('#00FF00')
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
