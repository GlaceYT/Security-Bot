const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all available commands.'),
    async execute(interaction) {
        await interaction.deferReply(); // Defer to avoid "Unknown Interaction"

        const commandFolders = fs.readdirSync(path.join(__dirname, '..')); // Read command categories
        const commands = [];

        for (const folder of commandFolders) {
            const folderPath = path.join(__dirname, '..', folder);
            if (!fs.lstatSync(folderPath).isDirectory()) continue; // Skip files

            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(path.join(folderPath, file));
                if (command.data) {
                    commands.push({ name: command.data.name, description: command.data.description, category: folder });
                }
            }
        }

        if (commands.length === 0) {
            return interaction.editReply('No commands found.');
        }

        const commandsPerPage = 5; // Adjust as needed
        const totalPages = Math.ceil(commands.length / commandsPerPage);
        let currentPage = 0;

        function generateEmbed(page) {
            const start = page * commandsPerPage;
            const end = start + commandsPerPage;
            const commandList = commands.slice(start, end);

            return new EmbedBuilder()
                .setTitle('📜 Help Menu')
                .setColor('#0099ff')
                .setDescription(commandList.map(cmd => `\`/${cmd.name}\` - ${cmd.description}`).join('\n') || 'No commands available.')
                .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
                .setTimestamp();
        }

        function createButtons(disabled = false) {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('◀️ Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled || currentPage === 0),

                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('▶️ Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled || currentPage === totalPages - 1)
            );
        }

        const message = await interaction.editReply({
            embeds: [generateEmbed(currentPage)],
            components: [createButtons()]
        });

        const collector = message.createMessageComponentCollector({ time: 20000 });

        collector.on('collect', async (btnInteraction) => {
            if (btnInteraction.user.id !== interaction.user.id) {
                return btnInteraction.reply({ content: '❌ You cannot interact with this button!', ephemeral: true });
            }

            await btnInteraction.deferUpdate(); // Defer to prevent "Unknown Interaction"

            if (btnInteraction.customId === 'prev_page' && currentPage > 0) {
                currentPage--;
            } else if (btnInteraction.customId === 'next_page' && currentPage < totalPages - 1) {
                currentPage++;
            }

            await interaction.editReply({
                embeds: [generateEmbed(currentPage)],
                components: [createButtons()]
            });
        });

        collector.on('end', async () => {
            await interaction.editReply({ components: [createButtons(true)] }); // Disable buttons after timeout
        });
    }
};
