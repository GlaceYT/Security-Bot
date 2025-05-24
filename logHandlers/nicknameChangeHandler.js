const LogSettings = require('../models/logSettings');
const { EmbedBuilder } = require('discord.js');

module.exports = function nicknameChangeHandler(client) {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        console.log('🟢 guildMemberUpdate event triggered'); // Debugging

        if (!oldMember.guild) return console.log('❌ No guild found.');
        
        const guildId = newMember.guild.id;

        // Fetch config
        const config = await LogSettings.findOne({ guildId });
        if (!config) return console.log('❌ No log settings found for this server.');

        if (!config.isActive.nicknameChange) {
            return console.log('❌ Logging for nicknameChange is disabled.');
        }

        const logChannelId = config.channels.nicknameChange;
        if (!logChannelId) return console.log('❌ No log channel set for nicknameChange.');

        const logChannel = newMember.guild.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        console.log(`✅ Logging nickname changes in: ${logChannel.id}`);

        if (oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setTitle('📝 Nickname Changed')
                .setColor('#00FFFF')
                .addFields(
                    { name: 'User', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                    { name: 'Old Nickname', value: oldMember.nickname || '*None*', inline: true },
                    { name: 'New Nickname', value: newMember.nickname || '*None*', inline: true }
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
