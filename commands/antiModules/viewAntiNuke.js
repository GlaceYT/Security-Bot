const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const AntiNukeSettings = require('../../models/AntiNukeSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('Manage anti-nuke settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View the current configuration of the anti-nuke module'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Edit the anti-nuke settings dynamically')
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Specify what to edit')
            .setRequired(true)
            .addChoices(
              { name: 'Ignored Roles', value: 'ignoredRoles' },
              { name: 'Ignored Members', value: 'ignoredMembers' },
              { name: 'Threshold Settings', value: 'thresholds' },
              { name: 'Cooldown Settings', value: 'cooldowns' }
            ))
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Action to perform')
            .setRequired(true)
            .addChoices(
              { name: 'Add', value: 'add' },
              { name: 'Delete', value: 'delete' },
              { name: 'Update', value: 'update' },
              { name: 'Clear', value: 'clear' }
            ))
        .addStringOption(option =>
          option
            .setName('content')
            .setDescription('Content to add, delete, or update (comma-separated if applicable)')
            .setRequired(false))),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    try {
      let settings = await AntiNukeSettings.findOne({ guildId });

      if (!settings) {
        if (subcommand === 'view') {
          return interaction.reply('⚠️ **No anti-nuke settings found for this server.**');
        }
        settings = new AntiNukeSettings({ guildId });
      }

      if (subcommand === 'view') {
        const embed = generateSettingsEmbed(settings, guildId, interaction.guild.iconURL());
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (subcommand === 'edit') {
        const type = interaction.options.getString('type');
        const action = interaction.options.getString('action');
        const content = interaction.options.getString('content')?.split(',').map(item => item.trim());

        let feedback;
        switch (type) {
          case 'ignoredRoles':
          case 'ignoredMembers':
            feedback = await manageDynamicContent(settings, type, action, content);
            break;

          case 'thresholds':
            feedback = await manageThresholds(settings, action, content);
            break;

          case 'cooldowns':
            feedback = await manageCooldowns(settings, action, content);
            break;

          default:
            return interaction.reply('❌ Invalid type. Unable to process the request.');
        }

        await settings.save();
        return interaction.reply(feedback);
      }
    } catch (error) {
      console.error('Error executing antinuke command:', error);
      return interaction.reply('❌ **An error occurred while processing the command.**');
    }
  },
};

// Helper: Generate Settings Embed
function generateSettingsEmbed(settings, guildId, iconURL) {
  const embed = new EmbedBuilder()
    .setColor('#2F3136')
    .setTitle('🛡️ Anti-Nuke Module Configuration')
    .setDescription('Here are the **current settings** for the anti-nuke module on this server:')
    .addFields(
      { name: '🟢 Active', value: settings.active ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: '📜 Log Channel', value: settings.logChannelId ? `<#${settings.logChannelId}>` : '⚠️ Not Set', inline: true },
      { name: '🚨 Quarantine Threshold', value: `${settings.thresholds.quarantine || 'N/A'}`, inline: true },
      { name: '🚨 Ban Threshold', value: `${settings.thresholds.ban || 'N/A'}`, inline: true },
      { name: '🕒 Cooldowns', value: formatCooldowns(settings.cooldowns), inline: false },
      { name: '🚫 Ignored Roles', value: formatList(settings.ignoredRoles, '<@&'), inline: false },
      { name: '🚫 Ignored Members', value: formatList(settings.ignoredMembers, '<@'), inline: false }
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

// Helper: Format Cooldowns for Embed
function formatCooldowns(cooldowns) {
  return Object.entries(cooldowns)
    .map(([action, duration]) => `${action}: ${duration / 1000}s`)
    .join('\n');
}

// Helper: Manage Dynamic Content
async function manageDynamicContent(settings, type, action, content) {
  if (!['ignoredRoles', 'ignoredMembers'].includes(type)) {
    return '❌ Invalid type for dynamic content.';
  }

  if (action === 'add' && content) {
    settings[type] = [...new Set([...settings[type], ...content])];
    return `✅ Added to **${type.replace(/([A-Z])/g, ' $1').toLowerCase()}**:\n${formatList(content)}`;
  } else if (action === 'delete' && content) {
    settings[type] = settings[type].filter(item => !content.includes(item));
    return `✅ Removed from **${type.replace(/([A-Z])/g, ' $1').toLowerCase()}**:\n${formatList(content)}`;
  } else if (action === 'clear') {
    settings[type] = [];
    return `✅ Cleared all items from **${type.replace(/([A-Z])/g, ' $1').toLowerCase()}**.`;
  }
  return '❌ No valid action performed.';
}

// Helper: Manage Thresholds
async function manageThresholds(settings, action, content) {
  if (action === 'update' && content) {
    const [actionType, threshold] = content;
    if (!settings.thresholds[actionType]) {
      return `❌ Invalid action type: ${actionType}.`;
    }
    settings.thresholds[actionType] = parseInt(threshold, 10);
    return `✅ Updated threshold for **${actionType}** to **${threshold}**.`;
  }
  return '❌ Invalid action or missing content for thresholds.';
}

// Helper: Manage Cooldowns
async function manageCooldowns(settings, action, content) {
  if (action === 'update' && content) {
    const [actionType, duration] = content;
    if (!settings.cooldowns[actionType]) {
      return `❌ Invalid action type: ${actionType}.`;
    }
    settings.cooldowns[actionType] = parseInt(duration, 10) * 1000;
    return `✅ Updated cooldown for **${actionType}** to **${duration}s**.`;
  }
  return '❌ Invalid action or missing content for cooldowns.';
}
