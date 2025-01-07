const fs = require('fs');
const path = require('path');

module.exports = async (client) => {
  // Connect to MongoDB
  await require('./mongodb.js')();

  // Load commands
  const commandFolders = fs.readdirSync('./commands');
  for (const folder of commandFolders) {
    const commandFiles = fs
      .readdirSync(`./commands/${folder}`)
      .filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(`./commands/${folder}/${file}`);
      client.commands.set(command.data.name, command);
    }
  }

  // Load events
  const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }

  try {
    const customEventFiles = fs.readdirSync('./antiModules').filter((file) => file.endsWith('.js'));
    console.log('Custom Event Files:', customEventFiles);
    for (const file of customEventFiles) {
      const event = require(`./antiModules/${file}`);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    }
  } catch (error) {
    console.error('Error loading custom event files:', error);
  }
  

  console.log('Bot is ready!');
};
