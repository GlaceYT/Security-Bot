const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const AntiSpamSettings = require('../../models/AntiSpamSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antispam')
    .setDescription('Manage anti-spam settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View the current configuration of the anti-spam module'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Edit the anti-spam settings dynamically')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Specify what to edit')
            .setRequired(true)
            .addChoices(
              { name: 'Ignored Roles', value: 'ignoredRoles' },
              { name: 'Active Roles', value: 'activeRoles' },
              { name: 'Ignored Channels', value: 'ignoredChannels' },
              { name: 'Active Channels', value: 'activeChannels' },
              { name: 'Blacklist Words', value: 'blacklistWords' },
              { name: 'Whitelist Words', value: 'whitelistWords' }
            ))
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Action to perform')
            .setRequired(true)
            .addChoices(
              { name: 'Add', value: 'add' },
              { name: 'Delete', value: 'delete' },
              { name: 'Clear', value: 'clear' }
            ))
        .addStringOption(option =>
          option
            .setName('content')
            .setDescription('Content to add or delete (comma-separated for multiple)')
            .setRequired(false))),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    try {
      let settings = await AntiSpamSettings.findOne({ guildId });

      if (!settings) {
        if (subcommand === 'view') {
          return interaction.reply('⚠️ **No anti-spam settings found for this server.**');
        }
        settings = new AntiSpamSettings({ guildId });
      }

      if (subcommand === 'view') {
        // Generate and display the settings embed
        const embed = generateSettingsEmbed(settings, guildId, interaction.guild.iconURL());
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (subcommand === 'edit') {
        const type = interaction.options.getString('type');
        const action = interaction.options.getString('action');
        const content = interaction.options.getString('content')?.split(',').map(item => item.trim());

        let updatedContent;
        switch (type) {
          case 'ignoredRoles':
          case 'activeRoles':
          case 'ignoredChannels':
          case 'activeChannels':
          case 'blacklistWords':
          case 'whitelistWords':
            updatedContent = await manageDynamicContent(settings, type, action, content);
            break;
          default:
            return interaction.reply('❌ Invalid type. Unable to process the request.');
        }

        await settings.save();

        const feedback = action === 'clear'
          ? `✅ Successfully cleared all items from **${formatType(type)}**.`
          : `✅ Successfully ${action}ed items in **${formatType(type)}**:\n${updatedContent}`;
        return interaction.reply(feedback);
      }
    } catch (error) {
      console.error('Error executing antispam command:', error);
      return interaction.reply('❌ **An error occurred while processing the command.**');
    }
  },
};

// Helper: Generate Settings Embed
function generateSettingsEmbed(settings, guildId, iconURL) {
  const embed = new EmbedBuilder()
    .setColor('#2F3136')
    .setTitle('🛡️ Anti-Spam Module Configuration')
    .setDescription('Here are the **current settings** for the anti-spam module on this server:')
    .addFields(
      { name: '🟢 Active', value: settings.active ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: '⏳ Cooldown Duration', value: `${settings.cooldownDuration || 0}s`, inline: true },
      { name: '🔢 Thresholds', value: `Messages: ${settings.thresholds?.messageLimit || 'N/A'}\nEmojis: ${settings.thresholds?.emojiLimit || 'N/A'}`, inline: false },
      { name: '🚫 Ignored Channels', value: formatList(settings.ignoredChannels, '<#'), inline: false },
      { name: '🔍 Active Channels', value: formatList(settings.activeChannels, '<#'), inline: false },
      { name: '🚫 Ignored Roles', value: formatList(settings.ignoredRoles, '<@&'), inline: false },
      { name: '🔍 Active Roles', value: formatList(settings.activeRoles, '<@&'), inline: false },
      { name: '🛡️ Blacklist Words', value: formatList(settings.blacklistWords), inline: false },
      { name: '✅ Whitelist Words', value: formatList(settings.whitelistWords), inline: false },
      { name: '📜 Log Channel', value: settings.logChannelId ? `<#${settings.logChannelId}>` : '⚠️ Not Set', inline: true },
      { name: '📢 Notify User', value: settings.notifyUser ? '✅ Yes' : '❌ No', inline: true },
      { name: '🛡️ Notify Moderators', value: settings.notifyModerators ? '✅ Yes' : '❌ No', inline: true },
      { name: '💬 Custom Messages', value: `Violation: ${settings.customMessages?.violation || '⚠️ Not Set'}\nTimeout: ${settings.customMessages?.timeout || '⚠️ Not Set'}`, inline: false }
    )
    .setFooter({ text: `Server ID: ${guildId}`, iconURL })
    .setTimestamp();

  return embed;
}

// Helper: Format List for Embed
function formatList(list, prefix = '') {
  if (!list || !list.length) return '✅ None';
  return list.map((item, index) => `${index + 1}. ${prefix || ''}${item}${prefix ? '>' : ''}`).join('\n');
}

// Helper: Manage Dynamic Content
async function manageDynamicContent(settings, type, action, content) {
  if (action === 'add' && content) {
    settings[type] = [...new Set([...settings[type], ...content])];
  } else if (action === 'delete' && content) {
    settings[type] = settings[type].filter(item => !content.includes(item));
  } else if (action === 'clear') {
    settings[type] = [];
  }
  return formatList(settings[type]);
}

// Helper: Format Type for Feedback
function formatType(type) {
  return type.replace(/([A-Z])/g, ' $1').toLowerCase();
}
