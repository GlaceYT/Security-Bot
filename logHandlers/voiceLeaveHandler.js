const LogSettings = require('../models/logSettings');
const { EmbedBuilder } = require('discord.js');

module.exports = function voiceLeaveHandler(client) {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (!oldState.channel || oldState.channelId === newState.channelId) return;

        const config = await LogSettings.findOne({ guildId: oldState.guild.id });
        if (!config || !config.isActive.voiceLeave) return;

        const logChannelId = config.channels.voiceLeave;
        if (!logChannelId) return console.log('❌ No log channel set for voiceLeave.');

        const logChannel = oldState.guild.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        const embed = new EmbedBuilder()
            .setTitle('🎤 Voice Channel Left')
            .setColor('#FF9900')
            .addFields(
                { name: 'User', value: `${oldState.member.user.tag} (${oldState.member.id})`, inline: true },
                { name: 'Channel', value: `<#${oldState.channel.id}> (${oldState.channel.id})`, inline: true }
            )
            .setTimestamp();

            try {
                await logChannel.send({ embeds: [embed] });
            } catch (error) {
                console.log(`❌ Failed to send log: ${error}`);
            }
            
    });
};
