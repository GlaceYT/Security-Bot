const LogSettings = require('../models/logSettings');
const { EmbedBuilder } = require('discord.js');

module.exports = function voiceJoinHandler(client) {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (!newState.channel || oldState.channelId === newState.channelId) return;

        const config = await LogSettings.findOne({ guildId: newState.guild.id });
        if (!config || !config.isActive.voiceJoin) return;

        const logChannelId = config.channels.voiceJoin;
        if (!logChannelId) return console.log('❌ No log channel set for voiceJoin.');

        const logChannel = newState.guild.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        const embed = new EmbedBuilder()
            .setTitle('🎤 Voice Channel Joined')
            .setColor('#00FFFF')
            .addFields(
                { name: 'User', value: `${newState.member.user.tag} (${newState.member.id})`, inline: true },
                { name: 'Channel', value: `<#${newState.channel.id}> (${newState.channel.id})`, inline: true }
            )
            .setTimestamp();

            try {
                await logChannel.send({ embeds: [embed] });
            } catch (error) {
                console.log(`❌ Failed to send log: ${error}`);
            }
            
    });
};
