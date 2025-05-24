const LogSettings = require('../models/logSettings');
const { EmbedBuilder } = require('discord.js');

module.exports = function roleDeleteHandler(client) {
    client.on('roleDelete', async (role) => {
        if (!role.guild) return console.log('❌ No guild found.');

        const config = await LogSettings.findOne({ guildId: role.guild.id });
        if (!config || !config.isActive.roleDelete) return;

        const logChannelId = config.channels.roleDelete;
        if (!logChannelId) return console.log('❌ No log channel set for roleDelete.');

        const logChannel = role.guild.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        const embed = new EmbedBuilder()
            .setTitle('🔴 Role Deleted')
            .setColor('#FF0000')
            .addFields(
                { name: 'Role', value: `${role.name} (${role.id})`, inline: true }
            )
            .setTimestamp();

            logChannel.send({ embeds: [embed] }).catch(error => console.log(`❌ Failed to send log: ${error}`));
    });
};
