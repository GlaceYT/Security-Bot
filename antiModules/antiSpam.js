const { EmbedBuilder } = require('discord.js');
const AntiSpamSettings = require('../models/AntiSpamSettings');
const UserViolations = require('../models/UserViolations');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;
    const now = Date.now();

    const settings = await AntiSpamSettings.findOne({ guildId });
    if (!settings || !settings.active) return;

    const {
      ignoredRoles,
      ignoredChannels,
      activeRoles,
      activeChannels,
      thresholds,
      whitelistWords,
      blacklistWords,
      logChannelId,
      notifyUser,
      customMessages,
      initialTimeoutDuration,
      timeoutIncrement,
      cooldownDuration,
    } = settings;

    // Ignored Conditions
    if (ignoredChannels.includes(message.channel.id)) return;
    if (ignoredRoles.some(role => message.member.roles.cache.has(role))) return;
    if (activeChannels.length > 0 && !activeChannels.includes(message.channel.id)) return;
    if (activeRoles.length > 0 && !activeRoles.some(role => message.member.roles.cache.has(role))) return;

    const messageContent = message.content.toLowerCase();

    // Whitelist Words Check
    if (whitelistWords.some(word => messageContent.includes(word))) return;

    // Immediate Action for Blacklisted Words
    if (blacklistWords.some(word => messageContent.includes(word))) {
      console.log('Blacklist word detected');
      const currentTimeout = initialTimeoutDuration;
      await takeAction(message, currentTimeout, 'blacklisted word usage', logChannelId, notifyUser, customMessages, client);
      return;
    }

    // Track User Messages
    let userViolation = await UserViolations.findOne({ userId, guildId, type: 'anti-spam' });
    if (!userViolation) {
      userViolation = new UserViolations({ userId, guildId, type: 'anti-spam' });
    }

    // Cleanup Expired Violations
    userViolation.violations.timestamps = userViolation.violations.timestamps.filter(
      timestamp => now - timestamp < cooldownDuration * 1000
    );

    // Add Current Message Timestamp
    userViolation.violations.timestamps.push(now);

    // Debug Logs
    console.log(`User ${userId} violations:`, userViolation.violations.timestamps);

    // Message Count and Emoji Count Check
    const violationCount = userViolation.violations.timestamps.length;
    console.log(`Violation count: ${violationCount}`);
    const emojiCount = (message.content.match(/<a?:\w+:\d+>/g) || []).length;
    console.log(`Emoji count: ${emojiCount}`);

    const isSpamDetected = violationCount >= thresholds.messageLimit || emojiCount > thresholds.emojiLimit;
    console.log(`Spam detected: ${isSpamDetected}`);

    if (isSpamDetected) {
      userViolation.violations.count += 1;
      const currentTimeout = initialTimeoutDuration + (userViolation.violations.count - 1) * timeoutIncrement;

      await userViolation.save();

      console.log('Spam detected');
      if (userViolation.violations.count === 1) {
        await warnUser(message, logChannelId, notifyUser, customMessages, client);
      } else {
        await takeAction(message, currentTimeout, 'spam', logChannelId, notifyUser, customMessages, client);
      }
    } else {
      await userViolation.save();
    }
  },
};

// Action handler for warnings
async function warnUser(message, logChannelId, notifyUser, customMessages, client) {
  // Notify the user
  if (notifyUser) {
    const userEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('Anti-Spam Warning')
      .setDescription(customMessages.violation)
      .setFooter({ text: 'This is your first warning for spamming.' });

    try {
      await message.author.send({ embeds: [userEmbed] });
    } catch (error) {
      console.warn(`Unable to send DM to user ${message.author.tag}: ${error.message}`);
    }
  }

  // Notify moderators
  if (logChannelId) {
    const logChannel = client.channels.cache.get(logChannelId);
    if (logChannel?.isTextBased()) {
      const logEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('Anti-Spam Warning')
        .setDescription(
          `**User:** ${message.author.tag} (${message.author.id})\n` +
          `**Channel:** <#${message.channel.id}>\n` +
          `**Reason:** spam warning`
        )
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  }
}

// Action handler for violations
async function takeAction(message, timeoutDuration, reason, logChannelId, notifyUser, customMessages, client) {
  // Notify the user
  if (notifyUser) {
    const userEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Anti-Spam Timeout')
      .setDescription(customMessages.timeout.replace('{duration}', (timeoutDuration / 60).toFixed(2)))
      .setFooter({ text: `Reason: ${reason}` });

    try {
      await message.author.send({ embeds: [userEmbed] });
    } catch (error) {
      console.warn(`Unable to send DM to user ${message.author.tag}: ${error.message}`);
    }
  }

  // Apply timeout
  try {
    await message.member.timeout(timeoutDuration * 1000, `Anti-Spam: ${reason}`);
  } catch (error) {
    console.error(`Failed to timeout user ${message.author.tag}: ${error.message}`);
  }

  // Notify moderators
  if (logChannelId) {
    const logChannel = client.channels.cache.get(logChannelId);
    if (logChannel?.isTextBased()) {
      const logEmbed = new EmbedBuilder()
        .setColor('#FF00FF')
        .setTitle('Anti-Spam Alert')
        .setDescription(
          `**User:** ${message.author.tag} (${message.author.id})\n` +
          `**Channel:** <#${message.channel.id}>\n` +
          `**Timeout Duration:** ${(timeoutDuration / 60).toFixed(2)} minutes\n` +
          `**Reason:** ${reason}`
        )
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  }

  // Delete message
  await message.delete().catch(console.error);
}