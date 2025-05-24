const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const VerificationConfig = require('../models/verificationConfig');
const crypto = require('crypto');
const verificationCodes = new Map();

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                interaction.reply({
                    content: 'There was an error executing this command!',
                    ephemeral: true,
                });
            }
        }

        // Handle Button Interactions (Verification Button)
        else if (interaction.isButton()) {
            if (interaction.customId === 'verify_button') {
                // Generate a random verification code
                const verificationCode = Math.random().toString(36).slice(2, 8).toUpperCase();
                verificationCodes.set(interaction.user.id, verificationCode);

                const modal = new ModalBuilder()
                    .setCustomId('verify_modal')
                    .setTitle('Verification');

                const input = new TextInputBuilder()
                    .setCustomId('verify_input')
                    .setLabel(`Enter this code: ${verificationCode}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const row = new ActionRowBuilder().addComponents(input);
                modal.addComponents(row);

                await interaction.showModal(modal);
            }
        }

        // Handle Modal Submissions (Verification Check)
        else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'verify_modal') {
                const userId = interaction.user.id;
                const userInput = interaction.fields.getTextInputValue('verify_input');
                const correctCode = verificationCodes.get(userId);

                if (!correctCode) {
                    return interaction.reply({ content: 'Verification expired! Click verify again.', ephemeral: true });
                }

                if (userInput !== correctCode) {
                    return interaction.reply({ content: 'Verification failed! Try again.', ephemeral: true });
                }

                const config = await VerificationConfig.findOne({ guildId: interaction.guild.id });
                if (!config) return;

                const member = interaction.guild.members.cache.get(userId);
                const unverifiedRole = interaction.guild.roles.cache.get(config.unverifiedRoleId);
                const verifiedRole = interaction.guild.roles.cache.get(config.verifiedRoleId);

                if (!verifiedRole) return interaction.reply({ content: '⚠️ Verified role not found.', ephemeral: true });

                // Remove Unverified Role and Assign Verified Role
                if (unverifiedRole) {
                    await member.roles.remove(unverifiedRole);
                }
                await member.roles.add(verifiedRole);
                verificationCodes.delete(userId);

                await interaction.reply({ content: '✅ Verification successful! You now have access to the server.', ephemeral: true });
                await member.send('🎉 You have been verified and can now access the server!');
            }
        }
    },
};
