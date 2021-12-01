const { SlashCommandBuilder } = require('@discordjs/builders');
const interactionUtils = require("../services/interactionUtils");
const teamService = require("../services/teamService");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('team_name')
        .setDescription('Let you edit the name of your team')
        .addStringOption(option => option.setName('name')
            .setRequired(true)
            .setDescription('The new name of your team')
        ),
    async execute(interaction) {
        let team = await teamService.findTeamByGuildId(interaction.guildId)
        if (!team) {
            await interactionUtils.replyTeamNotRegistered(interaction)
            return
        }

        team.name = interaction.options.getString('name')
        await team.save()
        await interaction.reply(`✅ Your new team name is ${team.name}`)
    },
};