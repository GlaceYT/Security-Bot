const { SlashCommandBuilder } = require('@discordjs/builders');
const AntiSpamSettings = require('../../models/AntiSpamSettings');
const { canUseCoOwnerCommands } = require('../../utils/authCheck');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setantispam')
    .setDescription('Configure the anti-spam module')
    .addBooleanOption(option =>
      option.setName('active')
        .setDescription('Enable or disable the anti-spam module')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('cooldownduration')
        .setDescription('Cooldown duration in seconds to track messages')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('messagelimit')
        .setDescription('Number of messages in cooldown duration to trigger timeout')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('emojilimit')
        .setDescription('Number of emojis in a single message to trigger timeout')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('initialtimeoutduration')
        .setDescription('Initial timeout duration in seconds')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('timeoutincrement')
        .setDescription('Timeout increment duration in seconds')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('logchannel')
        .setDescription('Log channel for moderator alerts')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('whitelistwords')
        .setDescription('Comma-separated list of words to whitelist')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('blacklistwords')
        .setDescription('Comma-separated list of words to blacklist')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('ignoredroles')
        .setDescription('Comma-separated list of roles to ignore')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('activeroles')
        .setDescription('Comma-separated list of roles to monitor')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('ignoredchannels')
        .setDescription('Comma-separated list of channels to ignore')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('activechannels')
        .setDescription('Comma-separated list of channels to monitor')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('notifyuser')
        .setDescription('Notify users about timeouts')
        .setRequired(false)),
  async execute(interaction) {
    try {
      const guildId = interaction.guild.id;
      const guild = interaction.guild;
      const userId = interaction.user.id;
  
      // ✅ Allow Server Owner to Use Command
      if (guild.ownerId !== userId) {
        const hasPermission = await canUseCoOwnerCommands(userId, guildId);
        if (!hasPermission) {
          return interaction.reply({ content: '🚫 Only **Co-Owners** or the Server Owner can use this command.', ephemeral: true });
        }
      }
      let settings = await AntiSpamSettings.findOne({ guildId });
      if (!settings) settings = new AntiSpamSettings({ guildId });

      const options = interaction.options;

      // Update settings
      settings.active = options.getBoolean('active');
      settings.cooldownDuration = options.getInteger('cooldownduration') || settings.cooldownDuration;
      settings.thresholds.messageLimit = options.getInteger('messagelimit') || settings.thresholds.messageLimit;
      settings.thresholds.emojiLimit = options.getInteger('emojilimit') || settings.thresholds.emojiLimit;
      settings.initialTimeoutDuration = options.getInteger('initialtimeoutduration') || settings.initialTimeoutDuration;
      settings.timeoutIncrement = options.getInteger('timeoutincrement') || settings.timeoutIncrement;
      settings.logChannelId = options.getString('logchannel') || settings.logChannelId;

      // Update role and channel lists
      settings.ignoredRoles = options.getString('ignoredroles')?.split(',') || settings.ignoredRoles;
      settings.activeRoles = options.getString('activeroles')?.split(',') || settings.activeRoles;
      settings.ignoredChannels = options.getString('ignoredchannels')?.split(',') || settings.ignoredChannels;
      settings.activeChannels = options.getString('activechannels')?.split(',') || settings.activeChannels;

      // Update word lists
      settings.whitelistWords = options.getString('whitelistwords')?.split(',') || settings.whitelistWords;
      settings.blacklistWords = options.getString('blacklistwords')?.split(',') || settings.blacklistWords;

      settings.notifyUser = options.getBoolean('notifyuser') ?? settings.notifyUser;

      await settings.save();
      await interaction.reply('Anti-spam settings have been updated.');
    } catch (error) {
      console.error('Error executing setantispam command:', error);
      await interaction.reply('An error occurred while updating the anti-spam settings.');
    }
  },
};
