const { SlashCommandBuilder } = require('@discordjs/builders');
const AntiNukeSettings = require('../../models/AntiNukeSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setantinuke')
    .setDescription('Configure the anti-nuke module')
    .addBooleanOption(option =>
      option.setName('active')
        .setDescription('Enable or disable the anti-nuke module')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('logchannel')
        .setDescription('Log channel ID for anti-nuke alerts')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('quarantinerole')
        .setDescription('Role ID to quarantine suspicious users')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('thresholdquarantine')
        .setDescription('Number of violations before quarantining')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('thresholdban')
        .setDescription('Number of violations before banning')
        .setRequired(true))    
    .addIntegerOption(option =>
      option.setName('channelcreate')
        .setDescription('Max channels creation allowed within cooldown')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('channeldelete')
        .setDescription('Max channels deletion allowed within cooldown')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('rolecreate')
        .setDescription('Max roles creation allowed within cooldown')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('roledelete')
        .setDescription('Max roles deletion allowed within cooldown')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('memberkick')
        .setDescription('Max member kicks allowed within cooldown')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('memberban')
        .setDescription('Max bans allowed within cooldown')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('membertimeout')
        .setDescription('Max member timeouts allowed within cooldown')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('warnthreshold')
        .setDescription('Max warnings allowed within cooldown')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('cooldownchannelcreate')
        .setDescription('Cooldown for channel creation (ms)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('cooldownchanneldelete')
        .setDescription('Cooldown for channel deletion (ms)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('cooldownrolecreate')
        .setDescription('Cooldown for role creation (ms)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('cooldownroledelete')
        .setDescription('Cooldown for role deletion (ms)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('cooldownmemberkick')
        .setDescription('Cooldown for member kicks (ms)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('cooldownmemberban')
        .setDescription('Cooldown for member bans (ms)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('violationduration')
        .setDescription('Duration to track violations (ms)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('ignoredroles')
        .setDescription('Comma-separated role IDs to ignore')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('ignoredmembers')
        .setDescription('Comma-separated member IDs to ignore')
        .setRequired(false)),

  async execute(interaction) {
    try {
      const guildId = interaction.guild.id;

      let settings = await AntiNukeSettings.findOne({ guildId });
      if (!settings) {
        settings = new AntiNukeSettings({ guildId });
      }

      settings.active = interaction.options.getBoolean('active');
      settings.logChannelId = interaction.options.getString('logchannel');
      settings.quarantineRoleId = interaction.options.getString('quarantinerole');
      const thresholdQuarantine = interaction.options.getInteger('thresholdquarantine');
      if (thresholdQuarantine !== null) settings.thresholds.quarantine = thresholdQuarantine;

      const thresholdBan = interaction.options.getInteger('thresholdban');
      if (thresholdBan !== null) settings.thresholds.ban = thresholdBan;
      const thresholds = [
        'channelcreate', 'channeldelete', 'rolecreate', 'roledelete', 
        'memberkick', 'memberban', 'membertimeout', 'warnthreshold'
      ];
      const cooldowns = [
        'cooldownchannelcreate', 'cooldownchanneldelete', 
        'cooldownrolecreate', 'cooldownroledelete', 
        'cooldownmemberkick', 'cooldownmemberban'
      ];

      for (const field of thresholds) {
        const value = interaction.options.getInteger(field);
        if (value !== null) settings.thresholds[field.replace('cooldown', '')] = value;
      }

      for (const field of cooldowns) {
        const value = interaction.options.getInteger(field);
        if (value !== null) settings.cooldowns[field.replace('cooldown', '')] = value;
      }

      const violationDuration = interaction.options.getInteger('violationduration');
      if (violationDuration !== null) settings.violationDuration = violationDuration;

      const ignoredRoles = interaction.options.getString('ignoredroles')?.split(',');
      if (ignoredRoles) settings.ignoredRoles = ignoredRoles;

      const ignoredMembers = interaction.options.getString('ignoredmembers')?.split(',');
      if (ignoredMembers) settings.ignoredMembers = ignoredMembers;

      await settings.save();

      await interaction.reply('Anti-Nuke settings have been updated successfully.');
    } catch (error) {
      console.error('Error executing setantinuke command:', error);
      await interaction.reply('An error occurred while updating the anti-nuke settings.');
    }
  },
};
