const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const VerificationConfig = require('../../models/verificationConfig');
const { canUseCoOwnerCommands } = require('../../utils/authCheck');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-verification')
        .setDescription('Setup or disable the verification system.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand.setName('enable')
                .setDescription('Enable the verification system.'))
        .addSubcommand(subcommand =>
            subcommand.setName('disable')
                .setDescription('Disable the verification system and remove related settings.')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        // ✅ Allow Server Owner to Use Command
        if (guild.ownerId !== userId) {
            const hasPermission = await canUseCoOwnerCommands(userId, guild);
          if (!hasPermission) {
            return interaction.reply({ content: '🚫 Only **Co-Owners** or the Server Owner can use this command.', ephemeral: true });
          }
        }
        let config = await VerificationConfig.findOne({ guildId: guild.id }) || new VerificationConfig({ guildId: guild.id });

        if (interaction.options.getSubcommand() === 'enable') {
            if (config.verificationEnabled) {
                return interaction.editReply({ content: '⚠️ Verification system is already enabled.' });
            }

            // Create roles
            let unverifiedRole = await guild.roles.create({ name: 'Unverified', color: '#ff0000', permissions: [] });
            let verifiedRole = await guild.roles.create({ name: 'Verified', color: '#ffffff', permissions: [] });

            // Restrict `Unverified` from all channels
            await Promise.all(guild.channels.cache.map(channel => 
                channel.permissionOverwrites.edit(unverifiedRole, { ViewChannel: false })
            ));

            // Create verification channel
            const verificationChannel = await guild.channels.create({
                name: 'verify-here',
                type: 0,
                permissionOverwrites: [
                    { id: guild.id, deny: ['ViewChannel'] },
                    { id: unverifiedRole.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                ]
            });

            // Create verification embed
            const embed = new EmbedBuilder()
                .setTitle('Verification Required')
                .setDescription('Click the button below to verify yourself.')
                .setColor('#0099ff');

            const button = new ButtonBuilder()
                .setCustomId('verify_button')
                .setLabel('Verify')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);
            await verificationChannel.send({ embeds: [embed], components: [row] });

            // Save settings in DB
            config.verificationEnabled = true;
            config.unverifiedRoleId = unverifiedRole.id;
            config.verifiedRoleId = verifiedRole.id;
            config.verificationChannelId = verificationChannel.id;
            await config.save();

            return interaction.editReply({ content: '✅ Verification system enabled successfully!' });
        } 
        
        else if (interaction.options.getSubcommand() === 'disable') {
            if (!config.verificationEnabled) {
                return interaction.editReply({ content: '⚠️ Verification system is not enabled.' });
            }

            // Remove roles
            const unverifiedRole = guild.roles.cache.get(config.unverifiedRoleId);
            const verifiedRole = guild.roles.cache.get(config.verifiedRoleId);
            if (unverifiedRole) await unverifiedRole.delete();
            if (verifiedRole) await verifiedRole.delete();

            // Remove verification channel
            const verificationChannel = guild.channels.cache.get(config.verificationChannelId);
            if (verificationChannel) await verificationChannel.delete();

            // Remove settings from DB
            await VerificationConfig.deleteOne({ guildId: guild.id });

            // ✅ Prevent "Unknown Message" error by checking interaction state
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '✅ Verification system disabled and all settings removed.' });
            } else {
                await interaction.reply({ content: '✅ Verification system disabled and all settings removed.', ephemeral: true });
            }
        }
    }
};
