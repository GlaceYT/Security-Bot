const { REST, Routes } = require('discord.js');
require('dotenv').config();

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`${client.user.tag} is now online!`);

    client.user.setPresence({
      activities: [{ name: 'Monitoring the server', type: 3 }], 
      status: 'online',
    });


    const commands = [];
    const fs = require('fs');
    const commandFolders = fs.readdirSync('./commands');

    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`./commands/${folder}`)
        .filter((file) => file.endsWith('.js'));
      for (const file of commandFiles) {
        const command = require(`../commands/${folder}/${file}`);
        commands.push(command.data.toJSON());
      }
    }


    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(Routes.applicationCommands(client.user.id), {
        body: commands,
      });

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Failed to refresh commands:', error);
    }
  },
};
