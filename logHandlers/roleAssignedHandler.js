const LogSettings = require('../models/logSettings');
const { EmbedBuilder } = require('discord.js');

module.exports = function roleAssignedHandler(client) {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        console.log('🟢 guildMemberUpdate event triggered'); // Debugging

        if (!oldMember.guild) return console.log('❌ No guild found.');
        
        const guildId = newMember.guild.id;

        // Check for newly assigned roles
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        if (addedRoles.size === 0) return console.log('❌ No new roles assigned.');

        // Fetch config
        const config = await LogSettings.findOne({ guildId });
        if (!config) return console.log('❌ No log settings found for this server.');

        if (!config.isActive.roleAssigned) {
            return console.log('❌ Logging for roleAssigned is disabled.');
        }

        const logChannelId = config.channels.roleAssigned;
        if (!logChannelId) return console.log('❌ No log channel set for roleAssigned.');

        const logChannel = newMember.guild.channels.cache.get(logChannelId);
        if (!logChannel) return console.log(`❌ Log channel not found: ${logChannelId}`);

        console.log(`✅ Logging role assignments in: ${logChannel.id}`);

        addedRoles.forEach(role => {
            const embed = new EmbedBuilder()
                .setTitle('🔵 Role Assigned')
                .setColor('#0000FF')
                .addFields(
                    { name: 'User', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                    { name: 'Role', value: role.name, inline: true }
                )
                .setTimestamp();

                logChannel.send({ embeds: [embed] }).catch(error => console.log(`❌ Failed to send log: ${error}`));
        });
    });
};
