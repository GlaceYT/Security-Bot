const LogSettings = require('../models/logSettings');
const VerificationConfig = require('../models/verificationConfig');
const { EmbedBuilder } = require('discord.js');

module.exports = function memberJoinHandler(client) {
    client.on('guildMemberAdd', async (member) => {
        console.log('🟢 guildMemberAdd event triggered');

        if (!member.guild) {
            console.log('❌ No guild found for member.');
        }

        // Fetch verification config
        const verificationConfig = await VerificationConfig.findOne({ guildId: member.guild.id });
        if (verificationConfig && verificationConfig.verificationEnabled) {
            const unverifiedRole = member.guild.roles.cache.get(verificationConfig.unverifiedRoleId);
            if (unverifiedRole) {
                await member.roles.add(unverifiedRole);
                console.log(`✅ Assigned Unverified role to ${member.user.tag}`);
            } else {
                console.log('❌ Unverified role not found.');
            }
        }

        // Fetch log settings for member join
        const logConfig = await LogSettings.findOne({ guildId: member.guild.id });
        if (!logConfig) {
            console.log('❌ No log settings found for this server.');
        }

        if (logConfig && logConfig.isActive.memberJoin) {
            const logChannelId = logConfig.channels.memberJoin;
            if (!logChannelId) {
                console.log('❌ No log channel set for memberJoin.');
            }

            const logChannel = client.channels.cache.get(logChannelId);
            if (logChannel) {
                console.log(`✅ Logging member join in: ${logChannel.id}`);

                const embed = new EmbedBuilder()
                    .setTitle('🎉 Member Joined')
                    .setColor('#00FF00')
                    .addFields(
                        { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                        { name: 'Joined At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                    )
                    .setThumbnail(member.user.displayAvatarURL())
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
            console.log('❌ Logging for memberJoin is disabled.');
        }
    });
};
