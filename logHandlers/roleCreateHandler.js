const LogSettings = require('../models/logSettings');
const { EmbedBuilder } = require('discord.js');

module.exports = function roleCreateHandler(client) {
    client.on('roleCreate', async (role) => {
        if (!role.guild) return console.log('❌ No guild found.');

        const config = await LogSettings.findOne({ guildId: role.guild.id });
        if (!config || !config.isActive.roleCreate) return;

        const logChannelId = config.channels.roleCreate;
        if (!logChannelId) return console.log('❌ No log channel set for roleCreate.');

        const logChannel = role.guild.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        const embed = new EmbedBuilder()
            .setTitle('🟢 Role Created')
            .setColor(role.hexColor || '#00FF00')
            .addFields(
                { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
                { name: 'Color', value: role.hexColor.toUpperCase(), inline: true }
            )
            .setTimestamp();

            logChannel.send({ embeds: [embed] }).catch(error => console.log(`❌ Failed to send log: ${error}`));
    });
};
