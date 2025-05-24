const { SlashCommandBuilder } = require('@discordjs/builders');
const AntiLinkSettings = require('../../models/AntiLinkSettings');
const { canUseCoOwnerCommands } = require('../../utils/authCheck');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setantilink')
    .setDescription('Configure the anti-link module')
    .addBooleanOption(option => 
      option.setName('active')
          .setDescription('Set the anti-link module as active or not')
          .setRequired(true)) 
    .addIntegerOption(option => 
      option.setName('cooldownduration')
        .setDescription('Cooldown duration in seconds before a user can send another link')
        .setRequired(false)) // Changed to optional
    .addIntegerOption(option => 
      option.setName('thresholdwarn')
        .setDescription('Number of link violations before a warning')
        .setRequired(false)) // Changed to optional
    .addIntegerOption(option => 
      option.setName('thresholdtimeout')
        .setDescription('Number of link violations before a timeout')
        .setRequired(false)) // Changed to optional
    .addIntegerOption(option => 
      option.setName('thresholdkick')
        .setDescription('Number of link violations before a kick')
        .setRequired(false)) // Changed to optional
    .addIntegerOption(option => 
      option.setName('thresholdban')
        .setDescription('Number of link violations before a ban')
        .setRequired(false)) // Changed to optional
    .addStringOption(option => 
      option.setName('punishmenttype')
        .setDescription('Type of punishment to apply')
        .setRequired(false)
        .addChoices(
          { name: 'Warn', value: 'warn' },
          { name: 'Timeout', value: 'timeout' },
          { name: 'Kick', value: 'kick' },
          { name: 'Ban', value: 'ban' }
        ))
    .addIntegerOption(option => 
        option.setName('timeoutduration')
            .setDescription('Duration of timeout in minutes')
            .setRequired(false)) // Changed to optional
    .addStringOption(option => 
      option.setName('logchannel')
        .setDescription('Select the log channel')
        .setRequired(false))
    .addStringOption(option => 
        option.setName('activechannels')
            .setDescription('Channels to monitor (comma-separated IDs, optional)')
            .setRequired(false))
    .addStringOption(option => 
        option.setName('ignoredroles')
            .setDescription('Roles to ignore (comma-separated IDs)')
            .setRequired(false))
    .addStringOption(option => 
        option.setName('activeroles')
            .setDescription('Roles to monitor (comma-separated IDs, optional)')
            .setRequired(false))
    .addStringOption(option => 
        option.setName('ignoredchannels')
            .setDescription('Channels to ignore (comma-separated IDs)')
            .setRequired(false))
    .addBooleanOption(option => 
      option.setName('notifyuser')
        .setDescription('Notify the user about the violation')
        .setRequired(false))
    .addBooleanOption(option => 
      option.setName('notifymoderators')
        .setDescription('Notify moderators about the violation')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('customviolationmessage')
        .setDescription('Custom message for the violation')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('whitelistlinks')
        .setDescription('Comma-separated list of links to whitelist')
        .setRequired(false))    
    .addStringOption(option => 
      option.setName('blacklistlinks')
        .setDescription('Comma-separated list of links to blacklist')
        .setRequired(false)) // Words removed
    .addStringOption(option => 
      option.setName('custompunishmentmessage')
        .setDescription('Custom message for the punishment')
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
      // Fetch the existing settings or create a new object
      let settings = await AntiLinkSettings.findOne({ guildId });
      if (!settings) {
        settings = new AntiLinkSettings({ guildId });
      }

      // Update fields only if they are provided in the command
      const cooldownDuration = interaction.options.getInteger('cooldownduration');
      if (cooldownDuration !== null) settings.cooldownDuration = cooldownDuration;

      const ignoredRoles = interaction.options.getString('ignoredroles')?.split(',');
      if (ignoredRoles) settings.ignoredRoles = ignoredRoles;

      const activeRoles = interaction.options.getString('activeroles')?.split(',');
      if (activeRoles) settings.activeRoles = activeRoles;

      const ignoredChannels = interaction.options.getString('ignoredchannels')?.split(',');
      if (ignoredChannels) settings.ignoredChannels = ignoredChannels;

      const activeChannels = interaction.options.getString('activechannels')?.split(',');
      if (activeChannels) settings.activeChannels = activeChannels;

      const logChannel = interaction.options.getString('logchannel');
      if (logChannel) settings.logChannelId = logChannel;

      const notifyUser = interaction.options.getBoolean('notifyuser');
      if (notifyUser !== null) settings.notifyUser = notifyUser;

      const notifyModerators = interaction.options.getBoolean('notifymoderators');
      if (notifyModerators !== null) settings.notifyModerators = notifyModerators;

      const customViolationMessage = interaction.options.getString('customviolationmessage');
      if (customViolationMessage) settings.customMessages.violation = customViolationMessage;

      const customPunishmentMessage = interaction.options.getString('custompunishmentmessage');
      if (customPunishmentMessage) settings.customMessages.punishment = customPunishmentMessage;

      const thresholdWarn = interaction.options.getInteger('thresholdwarn');
      if (thresholdWarn !== null) settings.thresholds.warn = thresholdWarn;

      const thresholdTimeout = interaction.options.getInteger('thresholdtimeout');
      if (thresholdTimeout !== null) settings.thresholds.timeout = thresholdTimeout;

      const thresholdKick = interaction.options.getInteger('thresholdkick');
      if (thresholdKick !== null) settings.thresholds.kick = thresholdKick;

      const thresholdBan = interaction.options.getInteger('thresholdban');
      if (thresholdBan !== null) settings.thresholds.ban = thresholdBan;

      const punishmentType = interaction.options.getString('punishmenttype');
      if (punishmentType) settings.punishmentType = punishmentType;

      const active = interaction.options.getBoolean('active');
      if (active !== null) settings.active = active;

      const timeoutDuration = interaction.options.getInteger('timeoutduration');
      if (timeoutDuration !== null) settings.timeoutDurations = timeoutDuration * 60 * 1000;

      const blacklistLinks = interaction.options.getString('blacklistlinks')?.split(',');
      if (blacklistLinks) settings.blacklistLinks = blacklistLinks;

      const whitelistLinks = interaction.options.getString('whitelistlinks')?.split(',');
      if (whitelistLinks) settings.whitelistLinks = whitelistLinks;
      
      await settings.save();

      await interaction.reply('Anti-link settings have been updated.');
    } catch (error) {
      console.error('Error executing setantilink command:', error);
      await interaction.reply('An error occurred while updating the anti-link settings.');
    }
  },
};
