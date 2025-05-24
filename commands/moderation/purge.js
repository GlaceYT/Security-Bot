const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { canUseAdminCommands } = require('../../utils/authCheck');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('messages')
        .setDescription('Delete specific types of messages from the channel.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('usermessages')
                .setDescription('Delete all user messages in the channel.')
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of messages to delete (1-100).')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('specificuser')
                .setDescription('Delete messages from a specific user.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User whose messages will be deleted.')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of messages to delete (1-100).')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('botmessages')
                .setDescription('Delete all bot messages in the channel.')
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of messages to delete (1-100).')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('embeds')
                .setDescription('Delete messages that contain embeds.')
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of messages to delete (1-100).')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('links')
                .setDescription('Delete messages that contain links.')
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of messages to delete (1-100).')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('emojis')
                .setDescription('Delete messages that contain emojis.')
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of messages to delete (1-100).')
                        .setRequired(true))),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guild = interaction.guild;

        // Permission check
        if (guild.ownerId !== userId) {
            const hasPermission = await canUseAdminCommands(userId, guild);
            if (!hasPermission) {
                return interaction.reply({ content: '🚫 Only **Admins** or the Server Owner can use this command.', ephemeral: true });
            }
        }

        // Defer reply to prevent timeout
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const count = interaction.options.getInteger('count');
        const channel = interaction.channel;

        // Validate count
        if (count < 1 || count > 100) {
            return interaction.editReply({ content: '⚠️ Please provide a number between **1 and 100**.' });
        }

        try {
            // Fetch last 100 messages
            const messages = await channel.messages.fetch({ limit: 100 });

            // Get bot's message ID to avoid deleting it
            const botUserId = interaction.client.user.id;
            
            let filteredMessages;

            if (subcommand === 'usermessages') {
                filteredMessages = messages.filter(msg => !msg.author.bot).first(count);
            } else if (subcommand === 'specificuser') {
                const user = interaction.options.getUser('user');
                filteredMessages = messages.filter(msg => msg.author.id === user.id).first(count);
            } else if (subcommand === 'botmessages') {
                filteredMessages = messages.filter(msg => msg.author.bot).first(count);
            } else if (subcommand === 'embeds') {
                filteredMessages = messages.filter(msg => msg.embeds.length > 0).first(count);
            } else if (subcommand === 'links') {
                const urlRegex = /(https?:\/\/[^\s]+)/gi;
                filteredMessages = messages.filter(msg => urlRegex.test(msg.content)).first(count);
            } else if (subcommand === 'emojis') {
                const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
                filteredMessages = messages.filter(msg => emojiRegex.test(msg.content)).first(count);
            }

            // Ensure we don't delete the bot's response message
            filteredMessages = filteredMessages.filter(msg => msg.author.id !== botUserId);

            // If no messages match criteria
            if (!filteredMessages.length) {
                return interaction.editReply({ content: '⚠️ No messages matching the criteria were found.' });
            }

            // Delete messages
            await channel.bulkDelete(filteredMessages, true);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`✅ Deleted **${filteredMessages.length}** messages.`);

            await interaction.followUp({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error deleting messages:', error);

            let errorMessage = '❌ An error occurred while deleting messages.';
            if (error.code === 50013) {
                errorMessage = '❌ I do not have permission to delete messages.';
            } else if (error.code === 50034) {
                errorMessage = '⚠️ Cannot delete messages older than 14 days.';
            }

            return interaction.editReply({ content: errorMessage });
        }
    }
};
