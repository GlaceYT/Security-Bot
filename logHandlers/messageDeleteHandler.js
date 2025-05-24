const LogSettings = require('../models/logSettings');
const { EmbedBuilder } = require('discord.js');

module.exports = function messageDeleteHandler(client) {
    client.on('messageDelete', async (message) => {
        console.log('🟢 messageDelete event triggered'); // Debugging

        if (!message.guild) return console.log('❌ Message has no guild.');
        if (message.partial) return console.log('❌ Partial message, skipping.');

        // 🔥 Corrected query to fetch log settings properly
        const config = await LogSettings.findOne({ guildId: message.guild.id });

        if (!config) return console.log('❌ No log settings found for this server.');

        if (!config.isActive.messageDelete) {
            return console.log('❌ Logging for messageDelete is disabled.');
        }

        const logChannelId = config.channels.messageDelete;
        if (!logChannelId) return console.log('❌ No log channel set for messageDelete.');

        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        console.log(`✅ Logging message delete in channel: ${logChannel.id}`);

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Message Deleted')
            .setColor('#FF0000')
            .addFields(
                { name: 'Author', value: message.author?.tag || 'Unknown', inline: true },
                { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
                { name: 'Content', value: message.content || '*No content*' },
            )
            .setTimestamp();

            try {
                await logChannel.send({ embeds: [embed] });
            } catch (error) {
                console.log(`❌ Failed to send log: ${error}`);
            }
            
    });
};
