const LogSettings = require('../models/logSettings');
const { EmbedBuilder } = require('discord.js');

module.exports = function roleRemovedHandler(client) {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (!oldMember.guild) return console.log('❌ No guild found.');

        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        if (removedRoles.size === 0) return;

        const config = await LogSettings.findOne({ guildId: newMember.guild.id });
        if (!config || !config.isActive.roleRemoved) return;

        const logChannelId = config.channels.roleRemoved;
        if (!logChannelId) return console.log('❌ No log channel set for roleRemoved.');

        const logChannel = newMember.guild.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        removedRoles.forEach(role => {
            const embed = new EmbedBuilder()
                .setTitle('🔴 Role Removed')
                .setColor('#FF0000')
                .addFields(
                    { name: 'User', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                    { name: 'Role', value: role.name, inline: true }
                )
                .setTimestamp();

                logChannel.send({ embeds: [embed] }).catch(error => console.log(`❌ Failed to send log: ${error}`));
        });
    });
};
