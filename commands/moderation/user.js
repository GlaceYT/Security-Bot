
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Get user information.')
    // Subcommand: info (detailed information)
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Display detailed user information.')
        .addUserOption(option =>
          option
            .setName('target')
            .setDescription('Select a user')
            .setRequired(false)
        )
    )
    // Subcommand: avatar (display the avatar)
    .addSubcommand(subcommand =>
      subcommand
        .setName('avatar')
        .setDescription('Display the user\'s avatar.')
        .addUserOption(option =>
          option
            .setName('target')
            .setDescription('Select a user')
            .setRequired(false)
        )
    )
    // Subcommand: banner (display the banner)
    .addSubcommand(subcommand =>
      subcommand
        .setName('banner')
        .setDescription('Display the user\'s banner.')
        .addUserOption(option =>
          option
            .setName('target')
            .setDescription('Select a user')
            .setRequired(false)
        )
    ),
  async execute(interaction) {

      const subcommand = interaction.options.getSubcommand();
      let targetUser = interaction.options.getUser('target') || interaction.user;

      if (subcommand === 'banner') {
        try {
          targetUser = await interaction.client.users.fetch(targetUser.id, { force: true });
        } catch (error) {
          console.error('Failed to fetch user for banner:', error);
        }
      }

      if (subcommand === 'info') {
        // Fetch the member for guild-specific info
        const member = await interaction.guild.members.fetch(targetUser.id);
        const roles = member.roles.cache.filter(role => role.name !== '@everyone');
        const highestRole = member.roles.highest;

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('User Information')
          .setThumbnail(targetUser.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
          .setDescription(`
**Username:** ${targetUser.tag}
**User ID:** ${targetUser.id}
**Joined Discord:** ${targetUser.createdAt.toUTCString()}
**Joined Server:** ${member.joinedAt.toUTCString()}
**Roles:** ${roles.map(role => role.name).join(', ') || 'None'}
**Highest Role:** ${highestRole.name}
**Bot:** ${targetUser.bot ? 'Yes' : 'No'}
          `)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } 
      else if (subcommand === 'avatar') {
        const avatarURL = targetUser.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle(`${targetUser.tag}'s Avatar`)
          .setImage(avatarURL)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } 
      else if (subcommand === 'banner') {
        const bannerURL = targetUser.bannerURL({ format: 'png', dynamic: true, size: 1024 });
        if (!bannerURL) {
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('This user does not have a banner set.');
          return await interaction.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle(`${targetUser.tag}'s Banner`)
          .setImage(bannerURL)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
  }
};
