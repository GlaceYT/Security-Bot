const { EmbedBuilder } = require('discord.js');
const AntiLinkSettings = require('../models/AntiLinkSettings');
const UserViolations = require('../models/UserViolations');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    // Fetch Anti-Link Settings
    const settings = await AntiLinkSettings.findOne({ guildId });
    if (!settings || !settings.active) return;

    const {
      ignoredRoles,
      ignoredChannels,
      activeChannels,
      activeRoles,
      thresholds,
      whitelistLinks,
      blacklistLinks,
      notifyUser,
      notifyModerators,
      customMessages,
      logChannelId,
      violationDuration,
    } = settings;

    const now = Date.now();

    // Helper to check roles
    const hasRole = (member, roleList) =>
      roleList.some(role => member.roles.cache.has(role));

    // Ignore messages based on settings
    if (ignoredChannels.includes(message.channel.id)) return;
    if (hasRole(message.member, ignoredRoles)) return;
    if (activeChannels.length > 0 && !activeChannels.includes(message.channel.id)) return;
    if (activeRoles.length > 0 && !hasRole(message.member, activeRoles)) return;

    // Check for blacklist and whitelist links
    const containsBlacklistedLink = blacklistLinks.some(link => message.content.includes(link));
    const containsWhitelistedLink = whitelistLinks.some(link => message.content.includes(link));

    // If the message contains a whitelisted link, ignore it
    if (containsWhitelistedLink) return;

    // If no blacklist is defined, retract all links by default
    const linkRegex = /https?:\/\/[^\s]+/gi;
    const shouldRestrictAllLinks = blacklistLinks.length === 0 && linkRegex.test(message.content);

    // If no blacklist violation is found, ignore the message
    if (!containsBlacklistedLink && !shouldRestrictAllLinks) return;

    // Fetch or Create User Violation Record
    let userViolation = await UserViolations.findOne({ userId, guildId, type: 'anti-link' });
    if (!userViolation) {
      userViolation = new UserViolations({ userId, guildId, type: 'anti-link' });
    }

    // Cleanup expired violations
    userViolation.violations.timestamps = userViolation.violations.timestamps.filter(
      timestamp => now - timestamp < violationDuration
    );
    userViolation.violations.count = userViolation.violations.timestamps.length;

    // Add new violation
    userViolation.violations.timestamps.push(now);
    userViolation.violations.count += 1;
    await userViolation.save();

    const currentViolations = userViolation.violations.count;

    // Determine action based on violations
    let actionDescription = '';
    let actionTaken = false;
    let punishmentDuration = null;

    if (currentViolations >= thresholds.ban) {
      actionTaken = 'ban';
      actionDescription = 'You have been banned.';
    } else if (currentViolations >= thresholds.kick) {
      actionTaken = 'kick';
      actionDescription = 'You have been kicked.';
    } else if (currentViolations >= thresholds.timeout) {
      punishmentDuration = 10 * currentViolations * 60 * 1000; // Incremental timeout
      actionTaken = 'timeout';
      actionDescription = `You have been timed out for ${punishmentDuration / 60000} minutes.`;
    } else if (currentViolations >= thresholds.warn) {
      actionTaken = 'warn';
      actionDescription = 'You have been warned.';
    }

    // Notify the user (send DM before applying the punishment)
    if (notifyUser) {
      const resetTime = violationDuration - (now - userViolation.violations.timestamps[0]);
      const remainingTime = Math.ceil(resetTime / 1000 / 60); // Convert to minutes

      const userEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Anti-Link Violation')
        .setDescription(
          customMessages.violation.replace('{violations}', currentViolations) +
          `\n\nIf you continue sending restricted links within the next **${remainingTime} minutes**, your violation count will increase and may lead to severe penalties.`
        )
        .setFooter({ text: `Current Violation Count: ${currentViolations}` });

      try {
        await message.author.send({ embeds: [userEmbed] });
      } catch (error) {
        console.warn(`Unable to send DM to user ${message.author.tag}: ${error.message}`);
      }
    }

    // Apply punishment after sending DM
    if (actionTaken) {
      if (actionTaken === 'ban') {
        try {
          await message.member.ban({ reason: 'Exceeded anti-link violation threshold' });
        } catch (error) {
          console.error(`Failed to ban user ${message.author.tag}: ${error.message}`);
        }
      } else if (actionTaken === 'kick') {
        try {
          await message.member.kick('Exceeded anti-link violation threshold');
        } catch (error) {
          console.error(`Failed to kick user ${message.author.tag}: ${error.message}`);
        }
      } else if (actionTaken === 'timeout' && punishmentDuration) {
        try {
          await message.member.timeout(punishmentDuration, 'Exceeded anti-link violation threshold');
        } catch (error) {
          console.error(`Failed to timeout user ${message.author.tag}: ${error.message}`);
        }
      }
    }

    // Notify Moderators
    if (notifyModerators && logChannelId) {
      const logChannel = client.channels.cache.get(logChannelId);
      if (logChannel?.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setColor('#FF00FF')
          .setTitle('Anti-Link Alert')
          .setDescription(
            `**User:** ${message.author.tag} (${message.author.id})\n` +
            `**Channel:** <#${message.channel.id}>\n` +
            `**Violation Count:** ${currentViolations}`
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }
    }

    await message.delete().catch(console.error);
  },
};
