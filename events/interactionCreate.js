module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
      if (!interaction.isCommand()) return;
  
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
    },
  };
  