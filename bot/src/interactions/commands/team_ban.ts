import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { BOT_ADMIN_ROLE } from "../../constants";
import { ICommandHandler } from "../../handlers/commandHandler";
import { TeamBans } from "../../mongoSchema";
import { regionService } from "../../services/regionService";
import { teamService } from "../../services/teamService";

export default {
    data: new SlashCommandBuilder()
        .setName('team_ban')
        .setDescription('Ban a team from using the matchmaking')
        .addStringOption(option => option.setName('team_id')
            .setRequired(true)
            .setDescription('The ID of the team to ban'))
        .addStringOption(option => option.setName('reason')
            .setRequired(false)
            .setDescription('The reason of the ban'))
        .addIntegerOption(option => option.setName('duration')
            .setRequired(false)
            .setDescription('The duration of the ban in days. A value of -1 means unlimited ban. (Default value is 1)')),
    authorizedRoles: [BOT_ADMIN_ROLE],
    async execute(interaction: ChatInputCommandInteraction) {
        if (!regionService.isRegionalDiscord(interaction.guildId!)) {
            await interaction.reply({ content: '⛔ Only regional discord are allowed to ban team', ephemeral: true })
            return
        }
        
        const guildId = interaction.options.getString('team_id')!
        if (guildId === interaction.guildId) {
            await interaction.reply({ content: `⛔ You surely don't want to ban your own team !`, ephemeral: true })
            return
        }

        const team = await teamService.findTeamByGuildId(guildId)
        if (!team) {
            await interaction.reply({ content: '⛔ This team does not exist', ephemeral: true })
            return
        }

        if (team.region !== regionService.getRegionByGuildId(interaction.guildId!)) {            
            await interaction.reply({ content: '⛔ You are not allowed to ban a team that is not in your region', ephemeral: true })
            return
        }

        const duration = interaction.options.getInteger('duration') || 1
        if (duration != null && (duration != -1 && duration < 1)) {
            await interaction.reply({ content: `⛔ Please chose a duration of either -1 or greater than 0`, ephemeral: true })
            return
        }

        const reason = interaction.options.getString('reason');
        const now = Date.now()
        let expireAt = null
        if (duration > 0) {
            expireAt = now + duration * 24 * 60 * 60 * 1000
        } else if (duration != -1) {
            expireAt = now + 24 * 60 * 60 * 1000
        }
        await TeamBans.updateOne({ guildId: team.guildId }, { region: team.region, guildId: team.guildId, reason, expireAt }, { upsert: true })

        let formattedDate
        if (expireAt) {
            formattedDate = new Date(expireAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: 'numeric' })
        }
        await interaction.reply({ content: `The team ${team.prettyPrintName()} is now ${formattedDate ? `banned until **${formattedDate}**` : '**permanently banned**'}` })
    }
} as ICommandHandler;