const LogSettings = require('../models/logSettings'); // Fixed naming
const { EmbedBuilder } = require('discord.js');

module.exports = function moderationLogsHandler(client) {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        console.log('🟢 guildMemberUpdate event triggered'); // Debugging

        if (!oldMember.guild) return console.log('❌ No guild found.');
        
        const guildId = newMember.guild.id;

        // Fetch config
        const config = await LogSettings.findOne({ guildId });
        if (!config) return console.log('❌ No log settings found for this server.');

        if (!config.isActive.moderationLogs) {
            return console.log('❌ Logging for moderationLogs is disabled.');
        }

        const logChannelId = config.channels.moderationLogs;
        if (!logChannelId) return console.log('❌ No log channel set for moderationLogs.');

        const logChannel = newMember.guild.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        console.log(`✅ Logging moderation changes in: ${logChannel.id}`);

        // Check for timeout updates
        if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
            const embed = new EmbedBuilder()
                .setTitle('⏳ Timeout Updated')
                .setColor('#FF9900')
                .addFields(
                    { name: 'User', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                    { 
                        name: 'Timeout Until', 
                        value: newMember.communicationDisabledUntilTimestamp
                            ? `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>`
                            : '*None*', 
                        inline: true 
                    }
                )
                .setTimestamp();

                try {
                    await logChannel.send({ embeds: [embed] });
                } catch (error) {
                    console.log(`❌ Failed to send log: ${error}`);
                }
                
        }
    });
};
