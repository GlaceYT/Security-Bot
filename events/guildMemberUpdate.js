const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const LogSettings = require('../models/logSettings');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    try {
      const settings = await LogSettings.findOne({ guildId: newMember.guild.id });
      //console.log('Fetched Settings:', settings);

      if (!settings || !settings.isActive.roleUpdate) {
        //console.log('Role update logging is not active for this guild.');
        return;
      }

      const logChannelId = settings.channels.roleUpdate;
      //console.log('Log Channel ID:', logChannelId);

      if (!logChannelId) {
        //console.log('No log channel set for role updates.');
        return;
      }

      const logChannel = newMember.guild.channels.cache.get(logChannelId);
      if (!logChannel) {
        //console.log('Log Channel not found.');
        return;
      }

      const botPermissions = logChannel.permissionsFor(newMember.guild.members.me);
      if (
        !botPermissions ||
        !botPermissions.has([
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.EmbedLinks,
        ])
      ) {
        console.log('Bot lacks permissions for the log channel.');
        return;
      }

      const oldRoles = oldMember.roles.cache;
      const newRoles = newMember.roles.cache;

      const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
      const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));

      if (addedRoles.size === 0 && removedRoles.size === 0) {
        //console.log('No roles were added or removed.');
        return;
      }

      let description = `**User:** <@${newMember.id}> (${newMember.user.tag})\n\n`;
      if (addedRoles.size > 0) {
        description += `**Roles Added:** ${addedRoles.map((role) => `<@&${role.id}>`).join(', ')}\n`;
      }
      if (removedRoles.size > 0) {
        description += `**Roles Removed:** ${removedRoles.map((role) => `<@&${role.id}>`).join(', ')}\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Role Update')
        .setDescription(description)
        .setTimestamp()
        .setFooter({
          text: `User ID: ${newMember.id}`,
          iconURL: newMember.user.displayAvatarURL(),
        });

      await logChannel.send({ embeds: [embed] });
      //console.log('Role update log sent successfully.');
    } catch (error) {
      console.error('Error in guildMemberUpdate:', error);
    }
  },
};
