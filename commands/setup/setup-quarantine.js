const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const QuarantineConfig = require('../../models/quarantineConfig');
const { canUseCoOwnerCommands } = require('../../utils/authCheck');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-quarantine')
        .setDescription('Setup server configurations.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand.setName('enable')
                .setDescription('Enable the quarantine system.'))
        .addSubcommand(subcommand =>
            subcommand.setName('disable')
                .setDescription('Disable the quarantine system.')),

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

        let config = await QuarantineConfig.findOne({ guildId: guild.id }) || new QuarantineConfig({ guildId: guild.id });

        if (interaction.options.getSubcommand() === 'enable') {
            if (config.quarantineEnabled) {
                return interaction.editReply({ content: '🚨 Quarantine system is already enabled.' });
            }

            // Create Quarantine Role
            let quarantineRole = await guild.roles.create({
                name: 'Quarantine',
                color: '#FF00FF',
                permissions: []
            });

            // Restrict Quarantine Role from all channels
            await Promise.all(guild.channels.cache.map(channel => 
                channel.permissionOverwrites.edit(quarantineRole, { ViewChannel: false })
            ));

            // Create Jail Channel
            const quarantineChannel = await guild.channels.create({
                name: 'quarantine-zone',
                type: 0,
                permissionOverwrites: [
                    { id: guild.id, deny: ['ViewChannel'] },
                    { id: quarantineRole.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                ]
            });

            // Save settings
            config.quarantineEnabled = true;
            config.quarantineRoleId = quarantineRole.id;
            config.quarantineChannelId = quarantineChannel.id;
            await config.save();

            interaction.editReply({ content: '✅ Quarantine system enabled successfully!' });
        } 
        
        else if (interaction.options.getSubcommand() === 'disable') {
            if (!config.quarantineEnabled) {
                return interaction.editReply({ content: '❌ Quarantine system is not enabled.' });
            }

            const quarantineRole = guild.roles.cache.get(config.quarantineRoleId);
            if (quarantineRole) await quarantineRole.delete();

            const quarantineChannel = guild.channels.cache.get(config.quarantineChannelId);
            if (quarantineChannel) await quarantineChannel.delete();

            await QuarantineConfig.deleteOne({ guildId: guild.id });

            interaction.editReply({ content: '✅ Quarantine system disabled and all settings removed.' });
        }
    }
};
