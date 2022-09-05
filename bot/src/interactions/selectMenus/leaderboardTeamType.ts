import { InteractionUpdateOptions, SelectMenuInteraction } from "discord.js";
import { DEFAULT_LEADERBOARD_PAGE_SIZE } from "../../constants";
import { ISelectMenuHandler } from "../../handlers/selectMenuHandler";
import { GameType, interactionUtils, StatsType } from "../../services/interactionUtils";
import { Region } from "../../services/regionService";
import { TeamType } from "../../services/teamService";

export default {
    customId: 'leaderboard_team_type_select',
    async execute(interaction: SelectMenuInteraction) {
        const teamTypeValue = interaction.values[0]
        let teamType: TeamType | undefined = undefined
        if (teamTypeValue !== 'undefined') {
            teamType = parseInt(interaction.customId.split('_')[4])
        }
        const region: Region = interaction.customId.split('_')[5] as Region
        const reply = await interactionUtils.createLeaderboardReply(interaction, { page: 0, pageSize: DEFAULT_LEADERBOARD_PAGE_SIZE, region, statsType: StatsType.TEAMS, gameType: GameType.TEAM_AND_MIX, teamType })
        await interaction.update(reply as InteractionUpdateOptions)
    }
} as ISelectMenuHandler