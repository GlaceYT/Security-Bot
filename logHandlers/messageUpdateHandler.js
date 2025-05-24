const LogSettings = require('../models/logSettings');
const QuarantineConfig = require('../models/quarantineConfig');
const UserQuarantine = require('../models/userQuarantine');
const { EmbedBuilder } = require('discord.js');

module.exports = function eventHandler(client) {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        console.log('🟢 guildMemberUpdate event triggered');

        if (!newMember.guild) {
            console.log('❌ No guild found for member.');
        }

        // Fetch Quarantine Config
        const quarantineConfig = await QuarantineConfig.findOne({ guildId: newMember.guild.id });
        if (quarantineConfig && quarantineConfig.quarantineEnabled) {
            const quarantineRole = newMember.guild.roles.cache.get(quarantineConfig.quarantineRoleId);
            if (quarantineRole) {
                // Check the user's quarantine status from the database
                const userQuarantine = await UserQuarantine.findOne({ userId: newMember.id, guildId: newMember.guild.id });

                // If they are still quarantined and the role was manually removed, reapply it
                if (userQuarantine && userQuarantine.isQuarantined) {
                    if (oldMember.roles.cache.has(quarantineRole.id) && !newMember.roles.cache.has(quarantineRole.id)) {
                        await newMember.roles.add(quarantineRole);
                        await newMember.send('⚠ You cannot manually remove the quarantine role.');
                        console.log(`🔒 Reapplied Quarantine Role to ${newMember.user.tag}`);
                    }
                }
            } else {
                console.log('❌ Quarantine role not found.');
            }
        }

        // Fetch Log Settings for Member Updates
        const logConfig = await LogSettings.findOne({ guildId: newMember.guild.id });
        if (!logConfig) {
            console.log('❌ No log settings found for this server.');
        }
    });

    client.on('messageUpdate', async (oldMessage, newMessage) => {
        console.log('🟢 messageUpdate event triggered');

        if (!oldMessage.guild) {
            console.log('❌ No guild found for message.');
        }
        if (oldMessage.partial || newMessage.partial) {
            console.log('❌ Partial message, skipping.');
        }

        // Fetch Log Settings for Message Updates
        const logConfig = await LogSettings.findOne({ guildId: oldMessage.guild.id });
        if (!logConfig) {
            console.log('❌ No log settings found for this server.');
        }

        if (logConfig && logConfig.isActive.messageUpdate) {
            const logChannelId = logConfig.channels.messageUpdate;
            if (!logChannelId) {
                console.log('❌ No log channel set for messageUpdate.');
            }

            const logChannel = client.channels.cache.get(logChannelId);
            if (logChannel) {
                console.log(`✅ Logging message update in: ${logChannel.id}`);

                const embed = new EmbedBuilder()
                    .setTitle('✏️ Message Edited')
                    .setColor('#FFFF00')
                    .addFields(
                        { name: 'Author', value: oldMessage.author?.tag || 'Unknown', inline: true },
                        { name: 'Channel', value: `<#${oldMessage.channel.id}>`, inline: true },
                        { name: 'Old Content', value: oldMessage.content?.slice(0, 1024) || '*No content*' },
                        { name: 'New Content', value: newMessage.content?.slice(0, 1024) || '*No content*' }
                    )
                    .setTimestamp();

                try {
                    await logChannel.send({ embeds: [embed] });
                } catch (error) {
                    console.log(`❌ Failed to send log: ${error}`);
                }
            } else {
                console.log(`❌ Log channel not found: ${logChannelId}`);
            }
        } else {
            console.log('❌ Logging for messageUpdate is disabled.');
        }
    });
};
