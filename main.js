require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('./mongodb.js');
const fs = require('fs');
const path = require('path');
const loadLogHandlers = require('./logHandlers');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();
client.events = new Collection();

// Connect to MongoDB
mongoose();
loadLogHandlers(client);

// Load commands
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`⚠️ Skipping command "${file}" as it is missing required properties.`);
    }
  }
}

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, './events')).filter((file) => file.endsWith('.js'));
for (const file of eventFiles) {
  try {
    const event = require(`./events/${file}`);
    if (!event.name || !event.execute) {
      console.warn(`⚠️ Skipping event "${file}" as it is missing required properties.`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }

    console.log(`✅ Loaded event: ${event.name}`);
  } catch (error) {
    console.error(`❌ Error loading event "${file}":`, error);
  }
}

// Load custom events (antiModules)
try {
  const customEventFiles = fs.readdirSync(path.join(__dirname, './antiModules')).filter((file) => file.endsWith('.js'));
  for (const file of customEventFiles) {
    if (file === 'antiNuke.js') continue; // Skip antiNuke.js since it's not an event

    try {
      const event = require(`./antiModules/${file}`);
      if (!event.name || !event.execute) {
        console.warn(`⚠️ Skipping custom event "${file}" as it is missing required properties.`);
        continue;
      }

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }

      console.log(`✅ Loaded custom event: ${event.name}`);
    } catch (error) {
      console.error(`❌ Error loading custom event "${file}":`, error);
    }
  }
} catch (error) {
  console.error('❌ Error reading custom event files:', error);
}

// ✅ Load anti-nuke module as a separate function
try {
  const antiNuke = require('./antiModules/antiNuke');
  if (typeof antiNuke === 'function') {
    antiNuke(client);
    console.log('✅ Loaded Anti-Nuke module');
  } else {
    console.warn('⚠️ Anti-Nuke module is not a function, skipping.');
  }
} catch (error) {
  console.error('❌ Error loading Anti-Nuke module:', error);
}

console.log('🚀 Bot is ready!');
client.login(process.env.TOKEN);
