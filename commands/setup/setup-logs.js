const { SlashCommandBuilder } = require('discord.js');
const LogSettings = require('../../models/logSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-logs')
    .setDescription('Configure logging options for the server.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('welcome')
        .setDescription('Configure welcome logs.')
        .addBooleanOption((option) =>
          option.setName('active').setDescription('Enable or disable welcome logs.').setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel for welcome logs.')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('leave')
        .setDescription('Configure leave logs.')
        .addBooleanOption((option) =>
          option.setName('active').setDescription('Enable or disable leave logs.').setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel for leave logs.')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('edit')
        .setDescription('Configure message edit logs.')
        .addBooleanOption((option) =>
          option.setName('active').setDescription('Enable or disable edit logs.').setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel for edit logs.')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Configure message delete logs.')
        .addBooleanOption((option) =>
          option.setName('active').setDescription('Enable or disable delete logs.').setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel for delete logs.')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('roleupdate')
        .setDescription('Configure role update logs.')
        .addBooleanOption((option) =>
          option.setName('active').setDescription('Enable or disable role update logs.').setRequired(true)
        )
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel for role update logs.')
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const active = interaction.options.getBoolean('active');
    const channel = interaction.options.getChannel('channel');

    try {
      let settings = await LogSettings.findOne({ guildId: interaction.guild.id });

      if (!settings) {
        settings = await LogSettings.create({
          guildId: interaction.guild.id,
        });
      }

      // Map subcommand to camelCase key
      const subcommandKey = subcommand === 'roleupdate' ? 'roleUpdate' : subcommand;

      settings.isActive[subcommandKey] = active;
      if (channel) settings.channels[subcommandKey] = channel.id;

      await settings.save();

      interaction.reply({
        content: `Updated ${subcommand} logs:\nActive: **${active}**\nChannel: **${
          channel ? channel.toString() : 'No channel specified'
        }**`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: 'Failed to update the log settings.',
        ephemeral: true,
      });
    }
  },
};
