import { SelectMenuInteraction } from "discord.js";
import { ISelectMenuHandler } from "../../handlers/selectMenuHandler";
import { matchmakingService } from "../../services/matchmakingService";

export default {
    customId: 'select_challenge',
    async execute(interaction: SelectMenuInteraction) {
        await matchmakingService.challenge(interaction, interaction.values[0])
    }
} as ISelectMenuHandler