const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const AntiNukeSettings = require('../models/AntiNukeSettings');
const UserViolations = require('../models/UserViolations');

const antiNuke = (client) => {
    const nukeMap = new Map();
    console.log('\x1b[36m[ SECURITY ]\x1b[0m', '\x1b[32mAnti-Nuke System Active ✅\x1b[0m');

    // Events to monitor
    const monitoredEvents = {
        channelCreate: 'channelCreate',
        channelDelete: 'channelDelete',
        roleCreate: 'roleCreate',
        roleDelete: 'roleDelete',
        memberKick: 'guildMemberRemove',
        memberBan: 'guildBanAdd',
    };

    // Attach event listeners for events requiring audit logs
    for (const [actionType, event] of Object.entries(monitoredEvents)) {
        client.on(event, async (...args) => {
            console.log(`Event triggered: ${event}`);
            const guild = args[0]?.guild || (args[0]?.target ? args[0].target.guild : null);
            const targetId = args[0]?.id || args[0]?.user?.id || args[0]?.target?.id || null;

            if (guild && targetId) {
                console.log(`Handling action: ${actionType} for target ID: ${targetId}`);
                await handleNukeAction(guild, actionType, targetId);
            }
        });
    }

    // Handle memberTimeout directly
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
            await handleMemberTimeout(newMember.guild, newMember.id);
        }
    });

    async function handleNukeAction(guild, actionType, targetId) {
        const settings = await AntiNukeSettings.findOne({ guildId: guild.id });
        if (!settings || !settings.active) {
            console.log(`No anti-nuke settings found or not enabled for guild ${guild.id}`);
            return;
        }

        const { logChannelId, quarantineRoleId, thresholds, cooldowns, ignoredRoles, ignoredMembers } = settings;

        try {
            console.log(`Fetching audit logs for action type: ${actionType}`);
            const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: mapAuditType(actionType) });
            const logEntry = auditLogs.entries.first();

            if (!logEntry) {
                console.log('No relevant audit log entry found.');
                return;
            }

            const { executor } = logEntry;
            console.log(`Audit log entry found. Executor: ${executor.tag}`);
            if (executor.bot) return; // Ignore bots

            const member = await guild.members.fetch(executor.id).catch(() => null);
            if (!member) return;

            // Ignore users with specific roles or IDs
            if (ignoredRoles.some(roleId => member.roles.cache.has(roleId)) || ignoredMembers.includes(executor.id)) {
                return;
            }

            const currentTime = Date.now();
            const timerKey = `${guild.id}:${actionType}:${executor.id}`;
            const nukeData = nukeMap.get(timerKey) || { actions: 0, lastAction: currentTime };

            if (currentTime - nukeData.lastAction < cooldowns[actionType]) {
                nukeData.actions++;
                console.log(`Nuke data incremented for ${executor.tag}:`, nukeData.actions);
            } else {
                nukeData.actions = 1;
                console.log(`Nuke data reset for ${executor.tag}:`, nukeData.actions);
            }
            nukeData.lastAction = currentTime;
            nukeMap.set(timerKey, nukeData);

            console.log(`Nuke data for ${executor.tag}:`, nukeData);
            if (nukeData.actions >= 3) {
                console.log(`Threshold exceeded for ${executor.tag}`);
                const userViolation = await updateUserViolations(member, guild);

                // Handle first violation: Assign quarantine role and notify
                if (userViolation.violations.count === thresholds.quarantine) {
                    console.log(`First violation for ${executor.tag}: Quarantining`);
                    await sendDM(member, `You have been quarantined in **${guild.name}** for suspicious activity.`);
                    await member.roles.set([quarantineRoleId], 'Suspicious activities detected');
                    await notifyLog(
                        guild,
                        logChannelId,
                        `${member.user.tag} has been quarantined for suspicious activities (${actionType}).`
                    );
                }
                // Handle second or subsequent violations: Ban the user and notify
                else if (userViolation.violations.count >= thresholds.ban) {
                    console.log(`Repeated violations for ${executor.tag}: Banning`);
                    await sendDM(member, `You have been banned from **${guild.name}** for repeated suspicious activities.`);
                    await member.ban({ reason: `Exceeded anti-nuke violation threshold for ${actionType}` });
                    await notifyLog(
                        guild,
                        logChannelId,
                        `${member.user.tag} was banned for exceeding the anti-nuke threshold (${actionType}).`
                    );
                    // Clear the user's violations after banning
                    await clearUserViolations(member.id, guild.id);
                }
            } else {
                console.log(`Threshold not exceeded for ${executor.tag}`);
            }
        } catch (error) {
            console.error('Error handling anti-nuke logic:', error);
        }
    }

    async function handleMemberTimeout(guild, targetId) {
        const settings = await AntiNukeSettings.findOne({ guildId: guild.id });
        if (!settings || !settings.active) {
            console.log(`No anti-nuke settings found or not enabled for guild ${guild.id}`);
            return;
        }

        const { logChannelId, quarantineRoleId, thresholds, cooldowns } = settings;
        const actionType = 'memberTimeout';

        try {
            const member = await guild.members.fetch(targetId).catch(() => null);
            if (!member) return;

            const currentTime = Date.now();
            const timerKey = `${guild.id}:${actionType}:${targetId}`;
            const nukeData = nukeMap.get(timerKey) || { actions: 0, lastAction: currentTime };

            if (currentTime - nukeData.lastAction < cooldowns[actionType]) {
                nukeData.actions++;
            } else {
                nukeData.actions = 1;
            }
            nukeData.lastAction = currentTime;
            nukeMap.set(timerKey, nukeData);

            if (nukeData.actions >= 3) {
                const userViolation = await updateUserViolations(member, guild);

                // Handle first violation: Assign quarantine role and notify
                if (userViolation.violations.count === thresholds.quarantine) {
                    await sendDM(member, `You have been quarantined in **${guild.name}** for suspicious activity.`);
                    await member.roles.set([quarantineRoleId], 'Suspicious activities detected');
                    await notifyLog(
                        guild,
                        logChannelId,
                        `${member.user.tag} has been quarantined for suspicious activities (memberTimeout).`
                    );
                }
                // Handle second or subsequent violations: Ban the user and notify
                else if (userViolation.violations.count >= thresholds.ban) {
                    await sendDM(member, `You have been banned from **${guild.name}** for repeated suspicious activities.`);
                    await member.ban({ reason: `Exceeded anti-nuke violation threshold for memberTimeout` });
                    await notifyLog(
                        guild,
                        logChannelId,
                        `${member.user.tag} was banned for exceeding the anti-nuke threshold (memberTimeout).`
                    );
                    // Clear the user's violations after banning
                    await clearUserViolations(member.id, guild.id);
                }
            }
        } catch (error) {
            console.error('Error handling member timeout logic:', error);
        }
    }

    async function updateUserViolations(member, guild) {
        const now = Date.now();
        const userViolation = await UserViolations.findOneAndUpdate(
            { userId: member.id, guildId: guild.id, type: 'anti-nuke' },
            {
                $push: { 'violations.timestamps': now },
                $inc: { 'violations.count': 1 },
            },
            { new: true, upsert: true }
        );

        // Cleanup expired violations
        const settings = await AntiNukeSettings.findOne({ guildId: guild.id });
        userViolation.violations.timestamps = userViolation.violations.timestamps.filter(
            timestamp => now - timestamp < settings.violationDuration
        );
        userViolation.violations.count = userViolation.violations.timestamps.length;
        await userViolation.save();

        console.log(`Updated violations for ${member.user.tag}:`, userViolation.violations);
        return userViolation;
    }

    async function clearUserViolations(userId, guildId) {
        await UserViolations.findOneAndUpdate(
            { userId, guildId, type: 'anti-nuke' },
            {
                $set: { 'violations.count': 0, 'violations.timestamps': [] },
            }
        );
        console.log(`Cleared violations for user ${userId} in guild ${guildId}`);
    }

    async function notifyLog(guild, logChannelId, message) {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel?.isTextBased()) {
            await logChannel.send({ content: message });
        }
    }

    async function sendDM(member, message) {
        try {
            await member.send({ content: message });
        } catch (error) {
            console.error(`Failed to send DM to ${member.user.tag}:`, error);
        }
    }

    function mapAuditType(actionType) {
        const auditLogTypes = {
            channelCreate: 10, // CHANNEL_CREATE
            channelDelete: 12, // CHANNEL_DELETE
            roleCreate: 30, // ROLE_CREATE
            roleDelete: 32, // ROLE_DELETE
            memberKick: 20, // MEMBER_KICK
            memberBan: 22, // MEMBER_BAN_ADD
        };
        return auditLogTypes[actionType];
    }
};

module.exports = antiNuke;